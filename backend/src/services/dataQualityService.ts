import { SignalRepository } from '../repositories/signalRepository.js';
import { ConfigRepository } from '../repositories/configRepository.js';
import { RoutingRepository } from '../repositories/routingRepository.js';
import { RunLogRepository } from '../repositories/runLogRepository.js';
import { DataQualityIssue } from '../domain/application.js';

export class DataQualityService {
  private signalRepo: SignalRepository;
  private configRepo: ConfigRepository;
  private routingRepo: RoutingRepository;
  private runLogRepo: RunLogRepository;

  constructor(
    signalRepo = new SignalRepository(),
    configRepo = new ConfigRepository(),
    routingRepo = new RoutingRepository(),
    runLogRepo = new RunLogRepository()
  ) {
    this.signalRepo = signalRepo;
    this.configRepo = configRepo;
    this.routingRepo = routingRepo;
    this.runLogRepo = runLogRepo;
  }

  async detectDataQualityIssues(): Promise<DataQualityIssue[]> {
    const [signals, sysConfig, routingHints, runLogs] = await Promise.all([
      this.signalRepo.getSignals(),
      this.configRepo.getConfig(),
      this.routingRepo.getHints(),
      this.runLogRepo.getRuns(),
    ]);

    const issues: DataQualityIssue[] = [];
    let issueCounter = 1;

    const registeredProjects = new Set(sysConfig.projects.map((p) => p.id));
    const validRunNumbers = new Set(runLogs.map((r) => r.run));
    const unroutedFallback = sysConfig.fallbacks.unrouted || 'internal_unsorted';

    // 1. Detect Duplicate Signal IDs (Near duplicates / exact ID collision)
    const idMap = new Map<string, number>();
    for (const signal of signals) {
      idMap.set(signal.id, (idMap.get(signal.id) || 0) + 1);
    }
    for (const [id, count] of idMap.entries()) {
      if (count > 1) {
        issues.push({
          id: `dqi-${issueCounter++}`,
          type: 'DUPLICATE_SIGNAL_ID',
          severity: 'error',
          entityId: id,
          message: `Signal ID '${id}' is shared by ${count} distinct meeting records in signal-ledger.json.`,
          metadata: { occurrenceCount: count },
        });
      }
    }

    // 2. Detect Unrouted Signals (assigned to unrouted fallback or empty projects)
    for (const signal of signals) {
      if (!signal.projects || signal.projects.length === 0) {
        issues.push({
          id: `dqi-${issueCounter++}`,
          type: 'UNROUTED_SIGNAL',
          severity: 'warning',
          entityId: signal.id,
          message: `Signal '${signal.id}' has no assigned projects.`,
        });
      } else {
        for (const projId of signal.projects) {
          if (projId === unroutedFallback || !registeredProjects.has(projId)) {
            issues.push({
              id: `dqi-${issueCounter++}`,
              type: 'UNROUTED_SIGNAL',
              severity: 'warning',
              entityId: signal.id,
              projectId: projId,
              message: `Signal '${signal.id}' references unregistered/unrouted fallback project '${projId}'.`,
            });
          }
        }
      }
    }

    // 3. Detect Analyzed Signals Without Summaries
    for (const signal of signals) {
      if (signal.status) {
        for (const [projKey, statusObj] of Object.entries(signal.status)) {
          if (statusObj && statusObj.state === 'analyzed') {
            if (!signal.summary || signal.summary.trim() === '') {
              issues.push({
                id: `dqi-${issueCounter++}`,
                type: 'ANALYZED_SIGNAL_WITHOUT_SUMMARY',
                severity: 'warning',
                entityId: signal.id,
                projectId: projKey,
                message: `Signal '${signal.id}' is marked as 'analyzed' for project '${projKey}', but summary is null or empty.`,
                metadata: { state: statusObj.state, analyzed_at: statusObj.analyzed_at },
              });
            }
          }
        }
      }
    }

    // 4. Detect Dangling References (analysis_ref pointing to non-existent runs)
    for (const signal of signals) {
      if (signal.status) {
        for (const [projKey, statusObj] of Object.entries(signal.status)) {
          if (statusObj && statusObj.analysis_ref) {
            const match = statusObj.analysis_ref.match(/run-(\d+)/);
            if (match) {
              const runNum = parseInt(match[1], 10);
              if (!validRunNumbers.has(runNum)) {
                issues.push({
                  id: `dqi-${issueCounter++}`,
                  type: 'DANGLING_ANALYSIS_REFERENCE',
                  severity: 'error',
                  entityId: signal.id,
                  projectId: projKey,
                  message: `Signal '${signal.id}' status for project '${projKey}' references '${statusObj.analysis_ref}', which does not exist in run-log.jsonl (valid runs 100-160).`,
                  metadata: { referencedRun: statusObj.analysis_ref, parsedRunNumber: runNum },
                });
              }
            }
          }
        }
      }
    }

    // 5. Detect Invalid Routing Hints (targeting unregistered project, e.g. "quil")
    for (const hint of routingHints) {
      if (!registeredProjects.has(hint.project)) {
        issues.push({
          id: `dqi-${issueCounter++}`,
          type: 'INVALID_ROUTING_HINT',
          severity: 'error',
          entityId: hint.match,
          projectId: hint.project,
          message: `Routing hint for '${hint.match}' targets unregistered project '${hint.project}' (${hint.note}).`,
          metadata: { hintType: hint.type, author: hint.by, on: hint.on, note: hint.note },
        });
      }
    }

    // 6. Detect Failed Ingest Runs
    for (const runLog of runLogs) {
      if (runLog.status === 'fail') {
        issues.push({
          id: `dqi-${issueCounter++}`,
          type: 'FAILED_INGEST_RUN',
          severity: 'critical',
          entityId: `run-${runLog.run}`,
          message: `Ingestion run #${runLog.run} recorded pipeline failure: ${runLog.error}`,
          metadata: { run: runLog.run, error: runLog.error, started_at: runLog.started_at },
        });
      }
    }

    // 7. Detect Stale Feed / Outage Information
    const thresholdDays = sysConfig.feed_freshness_threshold_days || 3;
    for (const runLog of runLogs) {
      const runDate = new Date(runLog.started_at);
      if (isNaN(runDate.getTime())) continue;

      if (runLog.feeds) {
        for (const [feedName, feedInfo] of Object.entries(runLog.feeds)) {
          if (feedInfo && feedInfo.last_file) {
            const feedDate = new Date(feedInfo.last_file);
            if (!isNaN(feedDate.getTime())) {
              const diffTime = runDate.getTime() - feedDate.getTime();
              const diffDays = diffTime / (1000 * 3600 * 24);

              if (diffDays > thresholdDays) {
                issues.push({
                  id: `dqi-${issueCounter++}`,
                  type: 'STALE_FEED_INFORMATION',
                  severity: 'warning',
                  entityId: `run-${runLog.run}`,
                  message: `Run #${runLog.run} feed '${feedName}' last file date (${feedInfo.last_file}) is ${Math.floor(diffDays)} days older than run date (${runLog.started_at.split('T')[0]}), exceeding threshold of ${thresholdDays} days.`,
                  metadata: {
                    feed: feedName,
                    lastFile: feedInfo.last_file,
                    lagDays: Math.floor(diffDays),
                    thresholdDays,
                  },
                });
              }
            }
          }
        }
      }
    }

    return issues;
  }
}

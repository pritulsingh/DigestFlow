import { SignalRepository } from '../repositories/signalRepository.js';
import { ConfigRepository } from '../repositories/configRepository.js';
import { RoutingRepository } from '../repositories/routingRepository.js';
import { RunLogRepository } from '../repositories/runLogRepository.js';
import { FixtureAnomalyReport, AnomalyDetail } from '../domain/anomalies.js';

export class FixtureInspectionService {
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

  async inspectAndValidate(): Promise<FixtureAnomalyReport> {
    const [container, config, routingHints, runLogEntries] = await Promise.all([
      this.signalRepo.getContainer(),
      this.configRepo.getConfig(),
      this.routingRepo.getHints(),
      this.runLogRepo.getRuns(),
    ]);

    const anomalies: AnomalyDetail[] = [];
    const registeredProjectIds = new Set(config.projects.map((p) => p.id));
    const validRunNumbers = new Set(runLogEntries.map((r) => r.run));

    // 1. Detect Duplicate Signal IDs
    const idOccurrences = new Map<string, number>();
    for (const signal of container.signals) {
      idOccurrences.set(signal.id, (idOccurrences.get(signal.id) || 0) + 1);
    }

    for (const [id, count] of idOccurrences.entries()) {
      if (count > 1) {
        anomalies.push({
          category: 'DUPLICATE_SIGNAL_ID',
          severity: 'ERROR',
          description: `Signal ID '${id}' is shared by ${count} distinct meeting records in signal-ledger.json.`,
          affectedIdentifier: id,
          details: { occurrenceCount: count },
        });
      }
    }

    // 2. Detect Unregistered Project References (e.g. internal_unsorted)
    for (const signal of container.signals) {
      for (const projId of signal.projects) {
        if (!registeredProjectIds.has(projId)) {
          anomalies.push({
            category: 'UNREGISTERED_PROJECT_REFERENCE',
            severity: 'WARNING',
            description: `Signal '${signal.id}' references project '${projId}' which is not in config.json registered projects.`,
            affectedIdentifier: signal.id,
            details: { unlistedProject: projId },
          });
        }
      }
    }

    // 3. Detect Routing Hint Target Typos (e.g. quil)
    for (const hint of routingHints) {
      if (!registeredProjectIds.has(hint.project)) {
        anomalies.push({
          category: 'ROUTING_HINT_TARGET_TYPO',
          severity: 'ERROR',
          description: `Routing hint for '${hint.match}' targets unknown project '${hint.project}' (${hint.note}).`,
          affectedIdentifier: hint.match,
          details: { invalidProjectTarget: hint.project, note: hint.note },
        });
      }
    }

    // 4. Detect Orphaned Analysis Run References (analysis_ref vs run-log)
    for (const signal of container.signals) {
      if (signal.status) {
        for (const [projKey, statusObj] of Object.entries(signal.status)) {
          if (statusObj && statusObj.analysis_ref) {
            const runNumMatch = statusObj.analysis_ref.match(/run-(\d+)/);
            if (runNumMatch) {
              const runNum = parseInt(runNumMatch[1], 10);
              if (!validRunNumbers.has(runNum)) {
                anomalies.push({
                  category: 'ORPHANED_ANALYSIS_RUN_REFERENCE',
                  severity: 'WARNING',
                  description: `Signal '${signal.id}' status for '${projKey}' references '${statusObj.analysis_ref}', which does not exist in run-log.jsonl (valid runs 100-160).`,
                  affectedIdentifier: signal.id,
                  details: {
                    project: projKey,
                    referencedAnalysisRef: statusObj.analysis_ref,
                  },
                });
              }
            }
          }
        }
      }
    }

    // 5. Detect Run Log Pipeline Failures
    for (const runLog of runLogEntries) {
      if (runLog.status === 'fail') {
        anomalies.push({
          category: 'RUN_LOG_PIPELINE_FAILURE',
          severity: 'ERROR',
          description: `Run log #${runLog.run} recorded pipeline failure: ${runLog.error}`,
          affectedIdentifier: `run-${runLog.run}`,
          details: { run: runLog.run, error: runLog.error, startedAt: runLog.started_at },
        });
      }
    }

    return {
      totalSignals: container.signals.length,
      totalProjects: config.projects.length,
      totalRoutingHints: routingHints.length,
      totalRunLogs: runLogEntries.length,
      anomalies,
    };
  }
}

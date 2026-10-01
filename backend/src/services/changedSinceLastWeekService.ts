import { WeeklyDigestService } from './weeklyDigestService.js';
import { SignalRepository } from '../repositories/signalRepository.js';
import {
  WeeklyChangeComparison,
  SignalChangeItem,
  DataQualityIssue,
} from '../domain/application.js';

export class ChangedSinceLastWeekService {
  private digestService: WeeklyDigestService;
  private signalRepo: SignalRepository;

  constructor(
    digestService = new WeeklyDigestService(),
    signalRepo = new SignalRepository()
  ) {
    this.digestService = digestService;
    this.signalRepo = signalRepo;
  }

  /**
   * Derives the previous comparable week timeframe from [currentStart, currentEnd].
   * Example: 2026-07-20 to 2026-07-26 (7 days) -> 2026-07-13 to 2026-07-19
   */
  calculatePreviousPeriod(currentStart: string, currentEnd: string): { start: string; end: string } {
    const sDate = new Date(currentStart);
    const eDate = new Date(currentEnd);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error("Invalid date format. Use YYYY-MM-DD format.");
    }

    const durationMs = eDate.getTime() - sDate.getTime();
    if (durationMs < 0) {
      throw new Error("Invalid date range: 'from' cannot be after 'to'.");
    }

    // Default to 7-day period if single day or 0 duration
    const daysSpan = Math.max(1, Math.round(durationMs / (1000 * 3600 * 24)));
    const prevStartMs = sDate.getTime() - daysSpan * (1000 * 3600 * 24);
    const prevEndMs = sDate.getTime() - (1000 * 3600 * 24);

    const prevStartStr = new Date(prevStartMs).toISOString().split('T')[0];
    const prevEndStr = new Date(prevEndMs).toISOString().split('T')[0];

    return { start: prevStartStr, end: prevEndStr };
  }

  /**
   * Compares activity between the current selected week and the previous comparable week.
   */
  async compareWeeklyChanges(
    currentStart: string,
    currentEnd: string
  ): Promise<WeeklyChangeComparison> {
    const normCurrentStart = currentStart.split('T')[0];
    const normCurrentEnd = currentEnd.split('T')[0];

    const prevPeriod = this.calculatePreviousPeriod(normCurrentStart, normCurrentEnd);

    // 1. Generate Digests for both periods
    const [currentDigest, prevDigest, allSignals] = await Promise.all([
      this.digestService.generateDigestPreview(normCurrentStart, normCurrentEnd),
      this.digestService.generateDigestPreview(prevPeriod.start, prevPeriod.end),
      this.signalRepo.getSignals(),
    ]);

    const signalMap = new Map(allSignals.map((s) => [s.id, s]));
    const changes: SignalChangeItem[] = [];
    let changeCounter = 1;

    // Helper map of items by signalId
    const currentItemsMap = new Map<string, { item: any; projectId?: string }>();
    for (const sec of currentDigest.sections) {
      for (const item of sec.items) {
        currentItemsMap.set(item.signalId, { item, projectId: sec.projectId });
      }
    }

    const prevItemsMap = new Map<string, { item: any; projectId?: string }>();
    for (const sec of prevDigest.sections) {
      for (const item of sec.items) {
        prevItemsMap.set(item.signalId, { item, projectId: sec.projectId });
      }
    }

    // 2. Identify NEW_SIGNAL
    for (const [sigId, { item, projectId }] of currentItemsMap.entries()) {
      if (!prevItemsMap.has(sigId)) {
        const rawSignal = signalMap.get(sigId);
        const sourceRefs = [
          `signal-ledger.json#id:${sigId}`,
          ...(item.sourceRefs || []),
        ];

        changes.push({
          id: `chg-${changeCounter++}`,
          category: 'NEW_SIGNAL',
          entityId: sigId,
          projectId,
          description: `New signal detected in current period: '${item.title}' (${rawSignal?.date || 'N/A'}).`,
          currentState: { title: item.title, category: item.category, projects: rawSignal?.projects },
          sourceRecordRefs: sourceRefs,
        });

        // Check if new signal has notes
        if (rawSignal && rawSignal.notes) {
          changes.push({
            id: `chg-${changeCounter++}`,
            category: 'NEW_NOTE',
            entityId: sigId,
            projectId,
            description: `New operational note added to signal '${sigId}': ${rawSignal.notes}`,
            currentState: rawSignal.notes,
            sourceRecordRefs: sourceRefs,
          });
        }
      }
    }

    // 3. Identify STATUS_CHANGE & NEWLY_AVAILABLE_ANALYSIS
    for (const [sigId, { item: currItem, projectId }] of currentItemsMap.entries()) {
      if (prevItemsMap.has(sigId)) {
        const prevData = prevItemsMap.get(sigId)!;
        const rawSignal = signalMap.get(sigId);

        const currStatus = rawSignal?.status && projectId ? rawSignal.status[projectId] : undefined;
        const prevStatus = prevData.item.priority;

        if (currStatus) {
          if (currStatus.analyzed_at || currStatus.analysis_ref) {
            changes.push({
              id: `chg-${changeCounter++}`,
              category: 'NEWLY_AVAILABLE_ANALYSIS',
              entityId: sigId,
              projectId,
              description: `Analysis newly available for signal '${sigId}' under project '${projectId}' (ref: ${currStatus.analysis_ref || 'N/A'}, analyzed at: ${currStatus.analyzed_at || 'N/A'}).`,
              previousState: null,
              currentState: currStatus,
              sourceRecordRefs: [`signal-ledger.json#id:${sigId}`, ...(currStatus.files_reviewed || [])],
            });
          }

          if (currStatus.state && currStatus.state !== prevStatus) {
            changes.push({
              id: `chg-${changeCounter++}`,
              category: 'STATUS_CHANGE',
              entityId: sigId,
              projectId,
              description: `Status changed for signal '${sigId}' under project '${projectId}' to '${currStatus.state}'.`,
              previousState: prevStatus,
              currentState: currStatus.state,
              sourceRecordRefs: [`signal-ledger.json#id:${sigId}`],
            });
          }
        }

        // Newly missing summary check
        if ((!rawSignal?.summary || rawSignal.summary.trim() === '') && currItem.summary.includes('Pending')) {
          changes.push({
            id: `chg-${changeCounter++}`,
            category: 'NEWLY_MISSING_INFORMATION',
            entityId: sigId,
            projectId,
            description: `Signal '${sigId}' is analyzed under project '${projectId}' but lacks summary documentation.`,
            previousState: null,
            currentState: 'Summary missing',
            sourceRecordRefs: [`signal-ledger.json#id:${sigId}`],
          });
        }
      }
    }

    // 4. Identify NEW_DATA_QUALITY_ISSUE & RESOLVED_ISSUE
    const currentIssues = (currentDigest.metadata?.surfacedIssues as DataQualityIssue[]) || [];
    const prevIssues = (prevDigest.metadata?.surfacedIssues as DataQualityIssue[]) || [];

    const prevIssueIds = new Set(prevIssues.map((i) => `${i.type}:${i.entityId}`));
    const currIssueIds = new Set(currentIssues.map((i) => `${i.type}:${i.entityId}`));

    for (const issue of currentIssues) {
      const issueKey = `${issue.type}:${issue.entityId}`;
      if (!prevIssueIds.has(issueKey)) {
        changes.push({
          id: `chg-${changeCounter++}`,
          category: 'NEW_DATA_QUALITY_ISSUE',
          entityId: issue.entityId,
          projectId: issue.projectId,
          description: `New data quality issue detected (${issue.type}): ${issue.message}`,
          currentState: issue,
          sourceRecordRefs: [`data-quality:${issue.type}:${issue.entityId}`],
        });
      }
    }

    for (const issue of prevIssues) {
      const issueKey = `${issue.type}:${issue.entityId}`;
      if (!currIssueIds.has(issueKey)) {
        changes.push({
          id: `chg-${changeCounter++}`,
          category: 'RESOLVED_ISSUE',
          entityId: issue.entityId,
          projectId: issue.projectId,
          description: `Resolved data quality issue from previous week (${issue.type}): ${issue.message}`,
          previousState: issue,
          currentState: 'Resolved',
          sourceRecordRefs: [`data-quality:${issue.type}:${issue.entityId}`],
        });
      }
    }

    // 5. Compute Change Summary Counts
    const summary = {
      totalNewSignals: changes.filter((c) => c.category === 'NEW_SIGNAL').length,
      totalStatusChanges: changes.filter((c) => c.category === 'STATUS_CHANGE').length,
      totalNewlyAvailableAnalysis: changes.filter((c) => c.category === 'NEWLY_AVAILABLE_ANALYSIS').length,
      totalNewNotes: changes.filter((c) => c.category === 'NEW_NOTE').length,
      totalNewIssues: changes.filter((c) => c.category === 'NEW_DATA_QUALITY_ISSUE').length,
      totalResolvedIssues: changes.filter((c) => c.category === 'RESOLVED_ISSUE').length,
    };

    return {
      currentPeriod: {
        from: normCurrentStart,
        to: normCurrentEnd,
        start: normCurrentStart,
        end: normCurrentEnd,
      },
      previousPeriod: {
        from: prevPeriod.start,
        to: prevPeriod.end,
        start: prevPeriod.start,
        end: prevPeriod.end,
      },
      changes,
      summary,
    };
  }
}

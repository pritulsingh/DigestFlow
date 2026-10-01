import { SignalRepository } from '../repositories/signalRepository.js';
import { ConfigRepository } from '../repositories/configRepository.js';
import { DataQualityService } from './dataQualityService.js';
import { WeeklyDigest, DigestSection, DigestItem, DataQualityIssue } from '../domain/application.js';

export class WeeklyDigestService {
  private signalRepo: SignalRepository;
  private configRepo: ConfigRepository;
  private qualityService: DataQualityService;

  constructor(
    signalRepo = new SignalRepository(),
    configRepo = new ConfigRepository(),
    qualityService = new DataQualityService()
  ) {
    this.signalRepo = signalRepo;
    this.configRepo = configRepo;
    this.qualityService = qualityService;
  }

  /**
   * Generates an in-memory WeeklyDigest preview for the specified period [periodStart, periodEnd].
   * Does NOT persist anything or modify source data.
   */
  async generateDigestPreview(periodStart: string, periodEnd: string): Promise<WeeklyDigest> {
    // 1. Validate Date Parameters
    if (!periodStart || !periodEnd) {
      throw new Error("Parameters 'from' and 'to' are required in format YYYY-MM-DD.");
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date format. Use YYYY-MM-DD or valid ISO date strings.");
    }

    if (startDate > endDate) {
      throw new Error("Invalid date range: 'from' date cannot be after 'to' date.");
    }

    // Normalize date strings for comparison (YYYY-MM-DD)
    const normStart = periodStart.split('T')[0];
    const normEnd = periodEnd.split('T')[0];

    // 2. Fetch Data via Repositories & Services
    const [allSignals, sysConfig, allIssues] = await Promise.all([
      this.signalRepo.getSignals(),
      this.configRepo.getConfig(),
      this.qualityService.detectDataQualityIssues(),
    ]);

    // 3. Filter Signals by Date Range (inclusive)
    const periodSignals = allSignals.filter((signal) => {
      const sigDate = signal.date.split('T')[0];
      return sigDate >= normStart && sigDate <= normEnd;
    });

    const periodSignalIds = new Set(periodSignals.map((s) => s.id));

    // 4. Group Signals into Sections by Project
    const registeredProjects = sysConfig.projects;
    const sections: DigestSection[] = [];

    for (const project of registeredProjects) {
      const projSignals = periodSignals.filter(
        (s) => s.projects && s.projects.includes(project.id)
      );

      if (projSignals.length > 0) {
        const items: DigestItem[] = projSignals.map((signal) => {
          const statusObj = signal.status ? signal.status[project.id] : undefined;
          const statusState = statusObj ? statusObj.state : 'untracked';

          // Gather non-null source file paths
          const sourceRefs: string[] = [];
          if (signal.sources) {
            if (signal.sources.granola_note) sourceRefs.push(signal.sources.granola_note);
            if (signal.sources.transcript) sourceRefs.push(signal.sources.transcript);
            if (signal.sources.recording) sourceRefs.push(signal.sources.recording);
          }

          const summaryText =
            signal.summary && signal.summary.trim().length > 0
              ? signal.summary
              : `[Summary Pending - Status: ${statusState}]`;

          return {
            id: `item-${signal.id}-${project.id}`,
            signalId: signal.id,
            title: signal.title,
            summary: summaryText,
            body: summaryText,
            sourceRefs,
            sourceRecordRefs: sourceRefs,
            category: signal.type,
            type: signal.type,
            status: statusState,
            priority: statusState === 'pending' ? 'medium' : 'low',
          };
        });

        sections.push({
          id: `sec-${project.id}`,
          title: project.name,
          projectId: project.id,
          projectName: project.name,
          summary: `Executive activity overview for ${project.name} during period ${normStart} to ${normEnd}. ${projSignals.length} signal item(s) processed.`,
          items,
        });
      }
    }

    // 5. Handle Unrouted / Fallback Signals Section
    const unroutedFallback = sysConfig.fallbacks.unrouted || 'internal_unsorted';
    const unroutedSignals = periodSignals.filter(
      (s) =>
        !s.projects ||
        s.projects.length === 0 ||
        s.projects.includes(unroutedFallback) ||
        s.projects.some((p) => !registeredProjects.some((rp) => rp.id === p))
    );

    if (unroutedSignals.length > 0) {
      const unroutedItems: DigestItem[] = unroutedSignals.map((signal) => {
        const sourceRefs: string[] = [];
        if (signal.sources) {
          if (signal.sources.granola_note) sourceRefs.push(signal.sources.granola_note);
          if (signal.sources.transcript) sourceRefs.push(signal.sources.transcript);
          if (signal.sources.recording) sourceRefs.push(signal.sources.recording);
        }

        const unroutedSummary = signal.summary || '[Unrouted Activity - Needs Categorization]';

        return {
          id: `item-${signal.id}-unrouted`,
          signalId: signal.id,
          title: signal.title,
          summary: unroutedSummary,
          body: unroutedSummary,
          sourceRefs,
          sourceRecordRefs: sourceRefs,
          category: signal.type,
          type: signal.type,
          status: 'pending',
          priority: 'high',
        };
      });

      sections.push({
        id: `sec-unrouted`,
        title: 'Unsorted & Internal Activity',
        projectId: unroutedFallback,
        projectName: 'Unsorted & Internal Activity',
        summary: `Unrouted signal records requiring project categorization during period ${normStart} to ${normEnd}.`,
        items: unroutedItems,
      });
    }

    // 6. Surface Data Quality Issues Relevant to Period Signals or Operational Anomaly
    const surfacedIssues: DataQualityIssue[] = allIssues.filter((issue) => {
      if (issue.entityId && periodSignalIds.has(issue.entityId)) return true;
      if (
        issue.type === 'FAILED_INGEST_RUN' &&
        issue.metadata?.started_at &&
        (issue.metadata.started_at as string).split('T')[0] >= normStart &&
        (issue.metadata.started_at as string).split('T')[0] <= normEnd
      )
        return true;
      if (
        issue.type === 'UNROUTED_SIGNAL' ||
        issue.type === 'INVALID_ROUTING_HINT' ||
        issue.type === 'DUPLICATE_SIGNAL_ID' ||
        issue.type === 'STALE_FEED_INFORMATION'
      )
        return true;
      return false;
    });

    // 7. Construct & Return WeeklyDigest Representation
    const nowISO = new Date().toISOString();

    return {
      id: `preview-${normStart}-to-${normEnd}`,
      title: `Weekly Digest (${normStart} to ${normEnd})`,
      weekIdentifier: `${normStart}_${normEnd}`,
      status: 'draft',
      sections,
      createdAt: nowISO,
      updatedAt: nowISO,
      metadata: {
        periodStart: normStart,
        periodEnd: normEnd,
        totalSignalsInPeriod: periodSignals.length,
        sectionsCount: sections.length,
        surfacedIssues,
      },
    };
  }
}

import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import fsSync from 'node:fs';

import { WeeklyDigestService } from '../src/services/weeklyDigestService.js';
import { ChangedSinceLastWeekService } from '../src/services/changedSinceLastWeekService.js';
import { DataQualityService } from '../src/services/dataQualityService.js';
import { LocalDraftProvider } from '../src/services/draftProvider.js';
import { FixtureInspectionService } from '../src/services/fixtureInspectionService.js';
import { config } from '../src/config/index.js';

describe('Service Layer Test Suite', () => {
  describe('WeeklyDigestService (Weekly Aggregation & Project Grouping)', () => {
    it('WeeklyDigestService - Normal period aggregation', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2026-07-06', '2026-07-20');

      expect(digest).toBeDefined();
      expect(digest.status).toBe('draft');
      expect(digest.sections.length).toBeGreaterThan(0);
      expect(digest.metadata?.totalSignalsInPeriod).toBeGreaterThan(0);
    });

    it('WeeklyDigestService - Empty period returns empty sections', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2025-01-01', '2025-01-07');

      expect(digest).toBeDefined();
      expect(digest.sections.length).toBe(0);
      expect(digest.metadata?.totalSignalsInPeriod).toBe(0);
    });

    it('WeeklyDigestService - Date boundaries (inclusive filtering)', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2026-07-06', '2026-07-06');

      expect(digest).toBeDefined();
      expect(digest.metadata?.totalSignalsInPeriod).toBeGreaterThan(0);
      for (const section of digest.sections) {
        for (const item of section.items) {
          expect(item.title).toBeDefined();
        }
      }
    });

    it('WeeklyDigestService - Multiple projects grouping and section isolation', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2026-07-01', '2026-08-31');

      expect(digest.sections.length).toBeGreaterThanOrEqual(3);
      const projectIds = digest.sections.map((s) => s.projectId);
      const uniqueProjectIds = new Set(projectIds);
      expect(projectIds.length).toBe(uniqueProjectIds.size);
    });

    it('WeeklyDigestService - Missing data & pending status surfacing', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2026-07-01', '2026-08-31');

      let foundPendingOrMissingSummary = false;
      for (const section of digest.sections) {
        for (const item of section.items) {
          if (item.summary.includes('Pending') || item.priority === 'medium') {
            foundPendingOrMissingSummary = true;
            break;
          }
        }
      }
      expect(foundPendingOrMissingSummary).toBe(true);
    });

    it('WeeklyDigestService - Malformed relationships and unrouted signals surfacing', async () => {
      const service = new WeeklyDigestService();
      const digest = await service.generateDigestPreview('2026-07-01', '2026-08-31');

      const unroutedSection = digest.sections.find((s) => s.projectId === 'internal_unsorted');
      expect(unroutedSection).toBeDefined();
      expect(unroutedSection?.items.length).toBeGreaterThan(0);

      const surfacedIssues = digest.metadata?.surfacedIssues as any[];
      expect(Array.isArray(surfacedIssues)).toBe(true);
      expect(surfacedIssues.length).toBeGreaterThan(0);
    });

    it('WeeklyDigestService - Invalid date ranges throw validation error', async () => {
      const service = new WeeklyDigestService();

      await expect(service.generateDigestPreview('2026-08-01', '2026-07-01')).rejects.toThrow(
        'cannot be after'
      );
      await expect(service.generateDigestPreview('not-a-date', '2026-07-01')).rejects.toThrow(
        'Invalid date format'
      );
    });
  });

  describe('ChangedSinceLastWeekService (Week-over-Week Comparison)', () => {
    it('Calculates previous week period accurately', () => {
      const service = new ChangedSinceLastWeekService();
      const prevPeriod = service.calculatePreviousPeriod('2026-07-20', '2026-07-26');
      expect(prevPeriod.start).toBe('2026-07-14');
      expect(prevPeriod.end).toBe('2026-07-19');
    });

    it('Detects new signals and surfaces source traceability', async () => {
      const service = new ChangedSinceLastWeekService();
      const comparison = await service.compareWeeklyChanges('2026-07-20', '2026-07-27');

      expect(comparison).toBeDefined();
      expect(comparison.currentPeriod.start).toBe('2026-07-20');
      expect(comparison.currentPeriod.end).toBe('2026-07-27');

      const newSignalChanges = comparison.changes.filter((c) => c.category === 'NEW_SIGNAL');
      expect(newSignalChanges.length).toBeGreaterThan(0);

      for (const change of newSignalChanges) {
        expect(Array.isArray(change.sourceRecordRefs)).toBe(true);
        expect(change.sourceRecordRefs.length).toBeGreaterThan(0);
        expect(change.sourceRecordRefs[0]).toContain('signal-ledger.json#id:');
      }
    });

    it('Handles date boundary comparisons cleanly', async () => {
      const service = new ChangedSinceLastWeekService();
      const comparison = await service.compareWeeklyChanges('2026-07-06', '2026-07-06');

      expect(comparison.currentPeriod).toBeDefined();
      expect(comparison.previousPeriod).toBeDefined();
      expect(Array.isArray(comparison.changes)).toBe(true);
    });
  });

  describe('DataQualityService & FixtureInspectionService', () => {
    it('DataQualityService detects all supported fixture data quality issues', async () => {
      const service = new DataQualityService();
      const issues = await service.detectDataQualityIssues();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);

      const issueTypes = new Set(issues.map((i) => i.type));

      expect(issueTypes.has('UNROUTED_SIGNAL')).toBe(true);
      const unroutedIssues = issues.filter((i) => i.type === 'UNROUTED_SIGNAL');
      expect(unroutedIssues.length).toBe(9);

      expect(issueTypes.has('ANALYZED_SIGNAL_WITHOUT_SUMMARY')).toBe(true);
      expect(issueTypes.has('DANGLING_ANALYSIS_REFERENCE')).toBe(true);
      expect(issueTypes.has('DUPLICATE_SIGNAL_ID')).toBe(true);

      const dupIssues = issues.filter((i) => i.type === 'DUPLICATE_SIGNAL_ID');
      expect(dupIssues.length).toBe(3);

      expect(issueTypes.has('INVALID_ROUTING_HINT')).toBe(true);
      const hintIssue = issues.find((i) => i.type === 'INVALID_ROUTING_HINT');
      expect(hintIssue?.entityId).toBe('drafting');
      expect(hintIssue?.projectId).toBe('quil');

      expect(issueTypes.has('FAILED_INGEST_RUN')).toBe(true);
      const failedRunIssues = issues.filter((i) => i.type === 'FAILED_INGEST_RUN');
      expect(failedRunIssues.length).toBe(2);

      expect(issueTypes.has('STALE_FEED_INFORMATION')).toBe(true);
    });

    it('FixtureInspectionService identifies all fixture data quality anomalies', async () => {
      const inspectionService = new FixtureInspectionService();
      const report = await inspectionService.inspectAndValidate();

      expect(report.totalSignals).toBe(77);
      expect(report.totalProjects).toBe(5);
      expect(report.totalRoutingHints).toBe(3);
      expect(report.totalRunLogs).toBe(45);

      const anomalyCategories = new Set(report.anomalies.map((a) => a.category));
      expect(anomalyCategories.has('DUPLICATE_SIGNAL_ID')).toBe(true);
      expect(anomalyCategories.has('UNREGISTERED_PROJECT_REFERENCE')).toBe(true);
      expect(anomalyCategories.has('ROUTING_HINT_TARGET_TYPO')).toBe(true);
      expect(anomalyCategories.has('ORPHANED_ANALYSIS_RUN_REFERENCE')).toBe(true);
      expect(anomalyCategories.has('RUN_LOG_PIPELINE_FAILURE')).toBe(true);
    });
  });

  describe('Draft Generation (LocalDraftProvider)', () => {
    it('LocalDraftProvider generates deterministic unapproved draft payload', async () => {
      const provider = new LocalDraftProvider();
      const digestService = new WeeklyDigestService();
      const digest = await digestService.generateDigestPreview('2026-07-06', '2026-07-20');

      const draft = await provider.generateDraft(digest);

      expect(draft).toBeDefined();
      expect(draft.id).toBeDefined();
      expect(draft.digestId).toBe(digest.id);
      expect(draft.isApproved).toBe(false);
      expect(draft.content.status).toBe('draft');
      expect(draft.content.sections.length).toBe(digest.sections.length);
    });
  });

  describe('Source Fixture Integrity Verification', () => {
    it('Source fixture files remain byte-for-byte unchanged after service operations', () => {
      function getFileHash(filePath: string): string {
        const fileBuffer = fsSync.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }

      expect(getFileHash(config.fixtures.signalLedger)).toBe(
        '3bcb61518d23dde6a6c6c2704de3d5def2d13e118f5d52be0da8ce6087f3d546'
      );
      expect(getFileHash(config.fixtures.config)).toBe(
        'be3cbecc79e39a4da7795afd172e98081f97632f2b8292f04eddada8dea71719'
      );
      expect(getFileHash(config.fixtures.routingHints)).toBe(
        '733957eaa51ab53b69e8a8fe5f2fad2a6918285365a8834ee83ffe6bbad3c821'
      );
      expect(getFileHash(config.fixtures.runLog)).toBe(
        'b936635631c0551c8c4ffc55f022f792f5539ffd1ce9ab02b7cb83a702bcb90e'
      );
    });
  });
});

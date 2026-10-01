import { WeeklyDigest, Draft, DigestSection, DigestItem, DataQualityIssue } from '../domain/application.js';

export interface DraftGenerationOptions {
  includeIssuesSummary?: boolean;
  tone?: 'professional' | 'concise' | 'executive';
}

export interface DraftProvider {
  readonly providerName: string;
  generateDraft(digest: WeeklyDigest, options?: DraftGenerationOptions): Promise<Draft>;
}

export class LocalDraftProvider implements DraftProvider {
  readonly providerName = 'local-deterministic-template';

  /**
   * Generates a deterministic draft representation from structured WeeklyDigest facts.
   * Does NOT make external API calls or invent unsupported claims.
   */
  async generateDraft(digest: WeeklyDigest, options: DraftGenerationOptions = {}): Promise<Draft> {
    const tone = options.tone || 'professional';
    const includeIssues = options.includeIssuesSummary ?? true;

    const formattedSections: DigestSection[] = digest.sections.map((section) => {
      const formattedItems: DigestItem[] = section.items.map((item) => {
        // Factual formatting based strictly on input item fields
        const formattedSummary = this.formatItemSummary(item, tone);
        return {
          ...item,
          summary: formattedSummary,
          body: formattedSummary,
          sourceRecordRefs: item.sourceRecordRefs || item.sourceRefs || [],
          sourceRefs: item.sourceRefs || item.sourceRecordRefs || [],
        };
      });

      const sectionName = section.projectName || section.title;
      const sectionSummary =
        section.summary ||
        `Executive draft summary for ${sectionName}. Includes ${section.items.length} key operational item(s).`;

      return {
        ...section,
        title: section.title,
        projectName: sectionName,
        summary: sectionSummary,
        items: formattedItems,
      };
    });

    const issues = (digest.metadata?.surfacedIssues as DataQualityIssue[]) || [];
    const issueSummaryText =
      includeIssues && issues.length > 0
        ? `\n\n[Data Quality Note: ${issues.length} operational issues flagged for review]`
        : '';

    const draftedDigest: WeeklyDigest = {
      ...digest,
      title: `[DRAFT] ${digest.title}${issueSummaryText}`,
      sections: formattedSections,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...digest.metadata,
        draftedByProvider: this.providerName,
        toneUsed: tone,
        isHumanApproved: false,
      },
    };

    return {
      id: `draft-${digest.id}`,
      digestId: digest.id,
      version: 1,
      content: draftedDigest,
      isApproved: false,
      createdById: this.providerName,
      createdAt: new Date().toISOString(),
    };
  }

  private formatItemSummary(item: DigestItem, tone: string): string {
    const cleanSummary = item.summary.trim();

    if (tone === 'concise') {
      return `• ${item.title}: ${cleanSummary}`;
    }

    if (tone === 'executive') {
      const sourceCount = item.sourceRefs.length;
      const refNote = sourceCount > 0 ? ` (${sourceCount} source artifact${sourceCount > 1 ? 's' : ''})` : '';
      return `${item.title}: ${cleanSummary}${refNote}`;
    }

    // Default 'professional' tone
    return `${item.title} — ${cleanSummary}`;
  }
}

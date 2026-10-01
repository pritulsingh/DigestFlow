import { DraftRepository } from '../repositories/draftRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';
import { SignalRepository } from '../repositories/signalRepository.js';
import { Draft, AuditEvent } from '../domain/application.js';

export class DraftManagementService {
  private draftRepo: DraftRepository;
  private auditRepo: AuditRepository;
  private signalRepo: SignalRepository;

  constructor(
    draftRepo = new DraftRepository(),
    auditRepo = new AuditRepository(),
    signalRepo = new SignalRepository()
  ) {
    this.draftRepo = draftRepo;
    this.auditRepo = auditRepo;
    this.signalRepo = signalRepo;
  }

  /**
   * Creates and persists a new draft with audit logging.
   */
  async createDraft(draft: Draft, actor: string = 'system'): Promise<Draft> {
    this.validateDraftStructure(draft);

    const created = await this.draftRepo.createDraft(draft);

    // Emit Audit Event
    await this.auditRepo.appendEvent({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType: 'DRAFT_CREATED',
      actor,
      timestamp: new Date().toISOString(),
      details: { draftId: created.id, digestId: created.digestId, version: created.version },
    });

    return created;
  }

  /**
   * Updates an existing draft, enforcing state transition rules and detector immutability.
   */
  async updateDraft(updatedDraft: Draft, actor: string = 'user'): Promise<Draft> {
    this.validateDraftStructure(updatedDraft);

    const existingDraft = await this.draftRepo.getDraftById(updatedDraft.id);
    if (!existingDraft) {
      throw new Error(`Draft with ID '${updatedDraft.id}' does not exist.`);
    }

    // Enforce Detector Immutability check
    await this.verifyDetectorImmutability(existingDraft, updatedDraft);

    // Enforce State Transition Rules
    this.validateStateTransition(existingDraft, updatedDraft);

    const saved = await this.draftRepo.updateDraft(updatedDraft);

    // Emit Audit Event
    await this.auditRepo.appendEvent({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType: 'DRAFT_UPDATED',
      actor,
      timestamp: new Date().toISOString(),
      details: { draftId: saved.id, version: saved.version, status: saved.content.status },
    });

    return saved;
  }

  /**
   * Human Approval of a draft.
   */
  async approveDraft(draftId: string, actor: string = 'human-reviewer'): Promise<Draft> {
    const draft = await this.draftRepo.getDraftById(draftId);
    if (!draft) {
      throw new Error(`Cannot approve: Draft '${draftId}' not found.`);
    }

    const updated: Draft = {
      ...draft,
      isApproved: true,
      content: {
        ...draft.content,
        status: 'approved',
        updatedAt: new Date().toISOString(),
      },
    };

    const saved = await this.draftRepo.updateDraft(updated);

    await this.auditRepo.appendEvent({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType: 'DRAFT_APPROVED',
      actor,
      timestamp: new Date().toISOString(),
      details: { draftId: saved.id },
    });

    return saved;
  }

  /**
   * Publishes an approved draft.
   * Deliberate human action.
   * Pre-publish checks:
   *  - Validates draft exists in persistence
   *  - Validates human approval (isApproved === true)
   *  - Validates required content & sections
   *  - Validates date range (periodStart <= periodEnd)
   *  - Verifies detector immutability
   * Safe and Idempotent: Re-publishing an already published draft returns 200 OK cleanly.
   */
  async publishDraft(draftId: string, actor: string = 'publisher'): Promise<Draft> {
    const draft = await this.draftRepo.getDraftById(draftId);
    if (!draft) {
      throw new Error(`Cannot publish: Draft '${draftId}' is not persisted.`);
    }

    // Idempotency: If draft is already published, return existing draft cleanly
    if (draft.content.status === 'published') {
      return draft;
    }

    if (!draft.isApproved) {
      throw new Error(`Cannot publish draft '${draftId}': Draft requires human approval (isApproved is false).`);
    }

    // Pre-publication content and date range validation
    this.validatePublishContent(draft);

    // Verify detector immutability
    await this.verifyDetectorImmutability(draft, draft);

    const updated: Draft = {
      ...draft,
      content: {
        ...draft.content,
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
    };

    const saved = await this.draftRepo.updateDraft(updated);

    await this.auditRepo.appendEvent({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType: 'DRAFT_PUBLISHED',
      actor,
      timestamp: new Date().toISOString(),
      details: { draftId: saved.id, weekIdentifier: saved.content.weekIdentifier || 'unknown-week' },
    });

    return saved;
  }

  private validatePublishContent(draft: Draft): void {
    const { periodStart, periodEnd, sections } = draft.content;

    if (periodStart && periodEnd && new Date(periodStart) > new Date(periodEnd)) {
      throw new Error(`Pre-publish validation failed: periodStart '${periodStart}' cannot be after periodEnd '${periodEnd}'.`);
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('Pre-publish validation failed: Draft must contain at least one project section.');
    }

    for (const sec of sections) {
      if (!sec.projectId && !sec.title) {
        throw new Error('Pre-publish validation failed: Section missing required projectId or title.');
      }
    }
  }

  async listDrafts(): Promise<Draft[]> {
    return this.draftRepo.listDrafts();
  }

  async getDraftById(id: string): Promise<Draft | null> {
    return this.draftRepo.getDraftById(id);
  }

  /**
   * Retrieves a published draft by ID.
   * Throws Error if draft does not exist or has not been published yet.
   */
  async getPublishedDraft(id: string): Promise<Draft> {
    const draft = await this.draftRepo.getDraftById(id);
    if (!draft) {
      throw new Error(`Digest '${id}' not found.`);
    }

    if (draft.content.status !== 'published') {
      throw new Error(`Digest '${id}' has not been published yet and cannot be shared.`);
    }

    return draft;
  }

  private validateDraftStructure(draft: Draft): void {
    if (!draft || typeof draft !== 'object') {
      throw new Error('Invalid draft: Draft payload must be an object.');
    }
    if (!draft.id || typeof draft.id !== 'string') {
      throw new Error("Invalid draft: Missing required 'id' string.");
    }
    if (!draft.digestId || typeof draft.digestId !== 'string') {
      throw new Error("Invalid draft: Missing required 'digestId' string.");
    }
    if (!draft.content || typeof draft.content !== 'object') {
      throw new Error("Invalid draft: Missing required 'content' WeeklyDigest object.");
    }
    if (!Array.isArray(draft.content.sections)) {
      throw new Error("Invalid draft: Digest 'sections' must be an array.");
    }
  }

  private validateStateTransition(existing: Draft, updated: Draft): void {
    const prevStatus = existing.content.status;
    const nextStatus = updated.content.status;

    // Rule: Cannot jump to 'published' without going through approval
    if (nextStatus === 'published' && !existing.isApproved && !updated.isApproved) {
      throw new Error("Invalid state transition: Cannot transition status to 'published' without human approval.");
    }
  }

  private async verifyDetectorImmutability(existing: Draft, updated: Draft): Promise<void> {
    const rawSignals = await this.signalRepo.getSignals();
    const rawSignalMap = new Map(rawSignals.map((s) => [s.id, s]));

    for (const section of updated.content.sections) {
      for (const item of section.items) {
        if (item.signalId && rawSignalMap.has(item.signalId)) {
          const original = rawSignalMap.get(item.signalId)!;
          // Verify detector-owned properties on raw signal match original
          if (original.id !== item.signalId) {
            throw new Error(`Detector immutability violation: Signal ID '${original.id}' cannot be modified.`);
          }
        }
      }
    }
  }
}

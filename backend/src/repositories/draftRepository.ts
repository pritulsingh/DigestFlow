import { config } from '../config/index.js';
import { Draft } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';
import { RepositoryError } from './errors.js';

export class DraftRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.drafts) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Safely initializes drafts.json if missing.
   */
  async initialize(): Promise<void> {
    const exists = await FileStorage.exists(this.filePath);
    if (!exists) {
      await FileStorage.writeJsonAtomic(this.filePath, []);
    }
  }

  /**
   * Lists all persisted drafts.
   */
  async listDrafts(): Promise<Draft[]> {
    await this.initialize();
    return FileStorage.readJson<Draft[]>(this.filePath);
  }

  /**
   * Retrieves a draft by ID.
   */
  async getDraftById(id: string): Promise<Draft | null> {
    const drafts = await this.listDrafts();
    return drafts.find((d) => d.id === id) || null;
  }

  /**
   * Creates a new draft and atomically persists it to drafts.json.
   */
  async createDraft(draft: Draft): Promise<Draft> {
    const drafts = await this.listDrafts();

    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    if (existingIndex !== -1) {
      throw new RepositoryError(`Draft with ID '${draft.id}' already exists.`);
    }

    drafts.push(draft);
    await FileStorage.writeJsonAtomic(this.filePath, drafts);
    return draft;
  }

  /**
   * Updates an existing draft and atomically persists it to drafts.json.
   */
  async updateDraft(draft: Draft): Promise<Draft> {
    const drafts = await this.listDrafts();

    const index = drafts.findIndex((d) => d.id === draft.id);
    if (index === -1) {
      throw new RepositoryError(`Cannot update draft: Draft with ID '${draft.id}' not found.`);
    }

    drafts[index] = draft;
    await FileStorage.writeJsonAtomic(this.filePath, drafts);
    return draft;
  }

  /**
   * Retrieves published or approved drafts.
   */
  async getPublishedDrafts(): Promise<Draft[]> {
    const drafts = await this.listDrafts();
    return drafts.filter((d) => d.isApproved || d.content?.status === 'published');
  }
}

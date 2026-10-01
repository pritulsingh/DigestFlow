import { config } from '../config/index.js';
import { AuditEvent } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';

export class AuditRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.auditLog) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Safely initializes audit-log.jsonl if missing.
   */
  async initialize(): Promise<void> {
    const exists = await FileStorage.exists(this.filePath);
    if (!exists) {
      await FileStorage.ensureDirectory(this.filePath);
      // Touch file if missing
      await FileStorage.appendJsonL(this.filePath, { init: true, timestamp: new Date().toISOString() });
    }
  }

  /**
   * Appends an audit event to audit-log.jsonl safely as a single line.
   */
  async appendEvent(event: AuditEvent): Promise<AuditEvent> {
    await FileStorage.appendJsonL(this.filePath, event);
    return event;
  }

  /**
   * Reads all audit events from audit-log.jsonl.
   */
  async getEvents(): Promise<AuditEvent[]> {
    const exists = await FileStorage.exists(this.filePath);
    if (!exists) {
      return [];
    }
    const rawEvents = await FileStorage.readJsonL<any>(this.filePath);
    // Filter out initialization records if present
    return rawEvents.filter((e) => e.id && e.eventType) as AuditEvent[];
  }
}

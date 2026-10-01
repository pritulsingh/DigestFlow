import { config } from '../config/index.js';
import { Signal, SignalLedgerContainer } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';
import { FixtureValidationError } from './errors.js';

export class SignalRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.signalLedger) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Reads and validates signal-ledger container.
   */
  async getContainer(): Promise<SignalLedgerContainer> {
    const container = await FileStorage.readJson<SignalLedgerContainer>(this.filePath);

    if (typeof container !== 'object' || container === null) {
      throw new FixtureValidationError(this.filePath, 'Top-level structure must be a JSON object.');
    }
    if (typeof container.version !== 'number') {
      throw new FixtureValidationError(this.filePath, "Missing or invalid 'version' number.");
    }
    if (!Array.isArray(container.signals)) {
      throw new FixtureValidationError(this.filePath, "Missing or invalid 'signals' array.");
    }

    return container;
  }

  /**
   * Reads, validates, and returns typed array of Signal items.
   */
  async getSignals(): Promise<Signal[]> {
    const container = await this.getContainer();
    for (const [index, signal] of container.signals.entries()) {
      if (!signal.id || typeof signal.id !== 'string') {
        throw new FixtureValidationError(this.filePath, `Signal at index ${index} missing valid 'id'.`);
      }
      if (!signal.type || typeof signal.type !== 'string') {
        throw new FixtureValidationError(this.filePath, `Signal '${signal.id}' missing valid 'type'.`);
      }
      if (!signal.sources || typeof signal.sources !== 'object') {
        throw new FixtureValidationError(this.filePath, `Signal '${signal.id}' missing valid 'sources' object.`);
      }
    }
    return container.signals as Signal[];
  }

  /**
   * Finds signals matching a given project ID.
   */
  async findByProject(projectId: string): Promise<Signal[]> {
    const signals = await this.getSignals();
    return signals.filter((s) => s.projects && s.projects.includes(projectId));
  }
}

export { SignalRepository as SignalLedgerRepository };

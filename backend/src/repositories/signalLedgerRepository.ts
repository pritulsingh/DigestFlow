import { config } from '../config/index.js';
import { SignalLedgerContainer } from '../domain/fixtures.js';
import { FileStorage } from '../persistence/fileStorage.js';

export class SignalLedgerRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.signalLedger) {
    this.filePath = filePath;
  }

  async loadContainer(): Promise<SignalLedgerContainer> {
    return FileStorage.readJson<SignalLedgerContainer>(this.filePath);
  }
}

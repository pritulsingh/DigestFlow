import { config } from '../config/index.js';
import { Run } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';
import { FixtureValidationError } from './errors.js';

export class RunLogRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.runLog) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Reads, validates, and returns typed array of Run log entries.
   */
  async getRuns(): Promise<Run[]> {
    const runs = await FileStorage.readJsonL<Run>(this.filePath);

    if (!Array.isArray(runs)) {
      throw new FixtureValidationError(this.filePath, 'Run log fixture must produce an array of run objects.');
    }

    for (const [index, run] of runs.entries()) {
      if (typeof run.run !== 'number') {
        throw new FixtureValidationError(this.filePath, `Run log entry at line ${index + 1} missing numeric 'run'.`);
      }
      if (!run.started_at || typeof run.started_at !== 'string') {
        throw new FixtureValidationError(this.filePath, `Run log entry #${run.run} missing 'started_at'.`);
      }
      if (!run.status || typeof run.status !== 'string') {
        throw new FixtureValidationError(this.filePath, `Run log entry #${run.run} missing 'status'.`);
      }
    }

    return runs;
  }

  /**
   * Finds a run entry by its numeric run ID.
   */
  async findByRunNumber(runNumber: number): Promise<Run | null> {
    const runs = await this.getRuns();
    return runs.find((r) => r.run === runNumber) || null;
  }
}

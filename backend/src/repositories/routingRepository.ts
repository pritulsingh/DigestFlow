import { config } from '../config/index.js';
import { RoutingInformation } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';
import { FixtureValidationError } from './errors.js';

export class RoutingRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.routingHints) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Reads, validates, and returns typed RoutingInformation hints array.
   */
  async getHints(): Promise<RoutingInformation[]> {
    const hints = await FileStorage.readJson<RoutingInformation[]>(this.filePath);

    if (!Array.isArray(hints)) {
      throw new FixtureValidationError(this.filePath, 'Routing hints fixture must contain a JSON array.');
    }

    for (const [index, hint] of hints.entries()) {
      if (!hint.type || typeof hint.type !== 'string') {
        throw new FixtureValidationError(this.filePath, `Routing hint at index ${index} missing 'type'.`);
      }
      if (!hint.match || typeof hint.match !== 'string') {
        throw new FixtureValidationError(this.filePath, `Routing hint at index ${index} missing 'match'.`);
      }
      if (!hint.project || typeof hint.project !== 'string') {
        throw new FixtureValidationError(this.filePath, `Routing hint at index ${index} missing 'project'.`);
      }
    }

    return hints;
  }
}

export { RoutingRepository as RoutingHintsRepository };

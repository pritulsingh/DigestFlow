import { config } from '../config/index.js';
import { RoutingHint } from '../domain/fixtures.js';
import { FileStorage } from '../persistence/fileStorage.js';

export class RoutingHintsRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.routingHints) {
    this.filePath = filePath;
  }

  async loadHints(): Promise<RoutingHint[]> {
    return FileStorage.readJson<RoutingHint[]>(this.filePath);
  }
}

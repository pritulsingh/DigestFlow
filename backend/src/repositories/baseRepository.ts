import { FileStorage } from '../persistence/fileStorage.js';

export abstract class BaseFileRepository<T> {
  protected filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async exists(): Promise<boolean> {
    return FileStorage.exists(this.filePath);
  }

  async readAll(): Promise<T[]> {
    if (this.filePath.endsWith('.jsonl')) {
      return FileStorage.readJsonL<T>(this.filePath);
    }
    return FileStorage.readJson<T[]>(this.filePath);
  }
}

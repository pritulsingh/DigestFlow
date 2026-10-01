import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { FixtureNotFoundError, FixtureParseError, RepositoryError } from '../repositories/errors.js';
import { config } from '../config/index.js';

export class FileStorage {
  static resolvePath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * Sanitizes persistence paths to prevent arbitrary client path traversal or fixture modification.
   */
  static assertWriteAllowed(filePath: string): string {
    const resolved = this.resolvePath(filePath);

    // 1. Explicitly protect source data fixtures from write operations
    const protectedFixtures = [
      this.resolvePath(config.fixtures.signalLedger),
      this.resolvePath(config.fixtures.config),
      this.resolvePath(config.fixtures.routingHints),
      this.resolvePath(config.fixtures.runLog),
    ];

    if (protectedFixtures.includes(resolved)) {
      throw new RepositoryError(`BLOCKED: Write operation denied for protected source fixture '${resolved}'.`);
    }

    // 2. Prevent arbitrary filesystem path writes outside data directory or tmp directory
    const dataDir = path.resolve(__dirname, '../../../data');
    const tmpDir = path.resolve(os.tmpdir());

    const isInDataDir = !path.relative(dataDir, resolved).startsWith('..') && !path.isAbsolute(path.relative(dataDir, resolved));
    const isInTmpDir = !path.relative(tmpDir, resolved).startsWith('..') && !path.isAbsolute(path.relative(tmpDir, resolved));

    if (!isInDataDir && !isInTmpDir) {
      throw new RepositoryError(`BLOCKED: File write outside permitted data directory '${resolved}'.`);
    }

    return resolved;
  }

  static async ensureDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(this.resolvePath(filePath));
    await fs.mkdir(dir, { recursive: true });
  }

  static async exists(filePath: string): Promise<boolean> {
    try {
      const resolved = this.resolvePath(filePath);
      await fs.access(resolved);
      return true;
    } catch {
      return false;
    }
  }

  static async readJson<T>(filePath: string): Promise<T> {
    const resolved = this.resolvePath(filePath);
    let data: string;
    try {
      data = await fs.readFile(resolved, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new FixtureNotFoundError(resolved);
      }
      throw err;
    }

    try {
      return JSON.parse(data) as T;
    } catch (err: any) {
      throw new FixtureParseError(resolved, err.message);
    }
  }

  static async readJsonL<T>(filePath: string): Promise<T[]> {
    const resolved = this.resolvePath(filePath);
    let content: string;
    try {
      content = await fs.readFile(resolved, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new FixtureNotFoundError(resolved);
      }
      throw err;
    }

    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.map((line, index) => {
      try {
        return JSON.parse(line) as T;
      } catch (err: any) {
        throw new FixtureParseError(resolved, `Line ${index + 1}: ${err.message}`);
      }
    });
  }

  /**
   * Safe Atomic File Write for JSON Data.
   * Enforces write permission check, writes to temporary file, flushes, and renames target.
   */
  static async writeJsonAtomic<T>(filePath: string, data: T): Promise<void> {
    const resolved = this.assertWriteAllowed(filePath);
    await this.ensureDirectory(resolved);

    const tmpPath = `${resolved}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const payload = JSON.stringify(data, null, 2);

    try {
      await fs.writeFile(tmpPath, payload, 'utf-8');
      await fs.rename(tmpPath, resolved);
    } catch (err) {
      try {
        await fs.unlink(tmpPath);
      } catch {}
      throw err;
    }
  }

  /**
   * Safe Appended JSONL Write.
   * Enforces write permission check, appends single-line JSON records.
   */
  static async appendJsonL<T>(filePath: string, item: T): Promise<void> {
    const resolved = this.assertWriteAllowed(filePath);
    await this.ensureDirectory(resolved);

    const line = JSON.stringify(item) + '\n';
    await fs.appendFile(resolved, line, 'utf-8');
  }
}

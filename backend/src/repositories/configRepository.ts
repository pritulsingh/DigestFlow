import { config } from '../config/index.js';
import { SystemConfig, Project } from '../domain/index.js';
import { FileStorage } from '../persistence/fileStorage.js';
import { FixtureValidationError } from './errors.js';

export class ConfigRepository {
  private filePath: string;

  constructor(filePath: string = config.fixtures.config) {
    this.filePath = FileStorage.resolvePath(filePath);
  }

  /**
   * Reads, validates, and returns SystemConfig object.
   */
  async getConfig(): Promise<SystemConfig> {
    const sysConfig = await FileStorage.readJson<SystemConfig>(this.filePath);

    if (typeof sysConfig !== 'object' || sysConfig === null) {
      throw new FixtureValidationError(this.filePath, 'Configuration must be a JSON object.');
    }
    if (!Array.isArray(sysConfig.projects)) {
      throw new FixtureValidationError(this.filePath, "Missing or invalid 'projects' array.");
    }
    if (!Array.isArray(sysConfig.internal_domains)) {
      throw new FixtureValidationError(this.filePath, "Missing or invalid 'internal_domains' array.");
    }
    if (typeof sysConfig.fallbacks !== 'object' || sysConfig.fallbacks === null) {
      throw new FixtureValidationError(this.filePath, "Missing or invalid 'fallbacks' object.");
    }

    return sysConfig;
  }

  /**
   * Returns array of registered Project definitions.
   */
  async getProjects(): Promise<Project[]> {
    const sysConfig = await this.getConfig();
    for (const [index, project] of sysConfig.projects.entries()) {
      if (!project.id || typeof project.id !== 'string') {
        throw new FixtureValidationError(this.filePath, `Project at index ${index} missing valid 'id'.`);
      }
      if (!project.name || typeof project.name !== 'string') {
        throw new FixtureValidationError(this.filePath, `Project '${project.id}' missing valid 'name'.`);
      }
    }
    return sysConfig.projects as Project[];
  }

  /**
   * Finds project by project ID.
   */
  async findProjectById(projectId: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === projectId) || null;
  }
}

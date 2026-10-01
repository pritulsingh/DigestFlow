import { SignalRepository } from '../repositories/signalRepository.js';
import { ConfigRepository } from '../repositories/configRepository.js';
import { RunLogRepository } from '../repositories/runLogRepository.js';
import { Signal, Project, Run } from '../domain/index.js';

export class SourceDataService {
  private signalRepo: SignalRepository;
  private configRepo: ConfigRepository;
  private runLogRepo: RunLogRepository;

  constructor(
    signalRepo = new SignalRepository(),
    configRepo = new ConfigRepository(),
    runLogRepo = new RunLogRepository()
  ) {
    this.signalRepo = signalRepo;
    this.configRepo = configRepo;
    this.runLogRepo = runLogRepo;
  }

  async getAllSignals(): Promise<Signal[]> {
    return this.signalRepo.getSignals();
  }

  async getSignalsByProject(projectId: string): Promise<Signal[]> {
    return this.signalRepo.findByProject(projectId);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.configRepo.getProjects();
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.configRepo.findProjectById(projectId);
  }

  async getAllRuns(): Promise<Run[]> {
    return this.runLogRepo.getRuns();
  }

  async getRunByNumber(runNumber: number): Promise<Run | null> {
    return this.runLogRepo.findByRunNumber(runNumber);
  }
}

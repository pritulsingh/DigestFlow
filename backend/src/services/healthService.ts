import { config } from '../config/index.js';
import { HealthStatus, SystemInfo } from '../domain/types.js';
import { FileStorage } from '../persistence/fileStorage.js';

export class HealthService {
  static getHealth(): HealthStatus {
    return {
      status: 'healthy',
      service: 'Weekly Digest Composer API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  static async getSystemInfo(): Promise<SystemInfo> {
    const [signalLedger, configExist, routingHints, runLog] = await Promise.all([
      FileStorage.exists(config.fixtures.signalLedger),
      FileStorage.exists(config.fixtures.config),
      FileStorage.exists(config.fixtures.routingHints),
      FileStorage.exists(config.fixtures.runLog),
    ]);

    return {
      appName: 'Weekly Digest Composer',
      environment: config.env,
      fixturesStatus: {
        signalLedger,
        config: configExist,
        routingHints,
        runLog,
      },
    };
  }
}

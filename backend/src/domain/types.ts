export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface SystemInfo {
  appName: string;
  environment: string;
  fixturesStatus: {
    signalLedger: boolean;
    config: boolean;
    routingHints: boolean;
    runLog: boolean;
  };
}

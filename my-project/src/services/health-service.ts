export type HealthStatus = {
  status: 'ok';
  uptime: number; // seconds
  version?: string;
};

export class HealthService {
  constructor(private readonly now: () => number = () => Date.now()) {}

  getStatus(startTimeMs: number, version?: string): HealthStatus {
    const uptimeSeconds = Math.max(0, Math.floor((this.now() - startTimeMs) / 1000));
    return { status: 'ok', uptime: uptimeSeconds, version };
  }
}


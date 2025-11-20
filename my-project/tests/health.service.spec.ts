import { describe, it, expect } from 'vitest';
import { HealthService } from '../src/services/health-service';

describe('HealthService', () => {
  it('computes uptime in whole seconds and returns ok', () => {
    const fixedNow = 1_000_000; // ms
    const start = 990_500; // ms
    const svc = new HealthService(() => fixedNow);
    const result = svc.getStatus(start, '1.2.3');
    expect(result).toEqual({ status: 'ok', uptime: 9, version: '1.2.3' });
  });

  it('never returns negative uptime', () => {
    const fixedNow = 1_000_000; // ms
    const start = 1_100_000; // in the future
    const svc = new HealthService(() => fixedNow);
    const result = svc.getStatus(start);
    expect(result.uptime).toBe(0);
  });
});


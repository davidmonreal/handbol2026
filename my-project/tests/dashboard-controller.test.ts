import { describe, expect, it } from 'vitest';
import { buildDashboardCacheControl } from '../src/controllers/dashboard-controller';

describe('buildDashboardCacheControl', () => {
  it('returns no-store when cache is disabled', () => {
    expect(buildDashboardCacheControl(0, 300)).toBe('no-store');
    expect(buildDashboardCacheControl(-1, 300)).toBe('no-store');
  });

  it('returns public cache directive when enabled', () => {
    const result = buildDashboardCacheControl(60, 120);
    expect(result).toBe('public, s-maxage=60, stale-while-revalidate=120');
  });
});

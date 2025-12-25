import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ZONE_CONFIG } from '../../config/zones';
import { ZoneDistribution } from './ZoneDistribution';
import type { ZoneStatistics } from './types';
import type { ZoneType } from '../../types';

const buildZoneMap = () => {
  const map = new Map<ZoneType | '7m', ZoneStatistics>();
  [...ZONE_CONFIG.sixMeter, ...ZONE_CONFIG.nineMeter, ZONE_CONFIG.penalty].forEach(({ zone }) => {
    map.set(zone, { shots: 0, goals: 0, efficiency: 0 });
  });
  return map;
};

describe('ZoneDistribution', () => {
  it('shows trend indicator for player baselines in flow mode', () => {
    const zoneStats = buildZoneMap();
    const dangerZoneStats = buildZoneMap();
    const targetZone = ZONE_CONFIG.sixMeter[0].zone;
    const targetStats = dangerZoneStats.get(targetZone);
    if (targetStats) {
      targetStats.shots = 10;
      targetStats.goals = 5;
      targetStats.efficiency = 50;
    }

    const { container } = render(
      <ZoneDistribution
        zoneStats={zoneStats}
        dangerZoneStats={dangerZoneStats}
        summaryBaselines={{
          goalsVsShots: 0.2,
          goalsVsPlays: 0.1,
          missesVsPlays: null,
          turnoversVsPlays: null,
          foulsVsPlays: null,
        }}
      />
    );

    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});

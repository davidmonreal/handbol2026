import type { CalculatedStats, ZoneBaselineRatios } from '../types';
import type { ZoneStatistics } from '../types';
import type { ZoneType } from '../../../types';

const buildRatioMap = (stats: Map<ZoneType | '7m', ZoneStatistics>) => {
  const ratios = new Map<ZoneType | '7m', number | null>();
  stats.forEach((value, zone) => {
    ratios.set(zone, value.shots > 0 ? value.goals / value.shots : null);
  });
  return ratios;
};

export const buildZoneBaselineRatios = (stats: CalculatedStats): ZoneBaselineRatios => ({
  goalsVsShots: buildRatioMap(stats.zoneStats),
  goalsVsPlays: buildRatioMap(stats.dangerZoneStats),
  foulsVsPlays: buildRatioMap(stats.foulReceivedZoneStats),
  defenseFoulsVsPlays: buildRatioMap(stats.foulZoneStats),
});

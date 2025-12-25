import type { CalculatedStats, SummaryBaselineRatios } from '../types';

export const buildSummaryRatios = (stats: CalculatedStats): SummaryBaselineRatios => {
  const totalPlays = stats.totalShots + stats.totalTurnovers + stats.totalFouls;

  return {
    goalsVsShots: stats.totalShots > 0 ? stats.totalGoals / stats.totalShots : null,
    goalsVsPlays: totalPlays > 0 ? stats.totalGoals / totalPlays : null,
    missesVsPlays: totalPlays > 0 ? stats.totalMisses / totalPlays : null,
    turnoversVsPlays: totalPlays > 0 ? stats.totalTurnovers / totalPlays : null,
    foulsVsPlays: totalPlays > 0 ? stats.totalFouls / totalPlays : null,
  };
};

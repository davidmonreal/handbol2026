import type { MatchEvent } from '../../../types';
import type { MatchMeta, MetricsTrendData, MetricsTrendPoint } from '../types';

type Totals = {
  shots: number;
  goals: number;
  misses: number;
  turnovers: number;
  fouls: number;
  plays: number;
};

const buildEmptyTotals = (): Totals => ({
  shots: 0,
  goals: 0,
  misses: 0,
  turnovers: 0,
  fouls: 0,
  plays: 0,
});

const calculateTotals = (events: MatchEvent[]): Totals => {
  const shots = events.filter(e => e.category === 'Shot');
  const goals = shots.filter(e => e.action === 'Goal');
  const misses = shots.filter(e => e.action === 'Miss');
  const turnovers = events.filter(e => e.category === 'Turnover');
  const fouls = events.filter(e => e.category === 'Sanction' || e.category === 'Foul');
  const plays = shots.length + turnovers.length + fouls.length;

  return {
    shots: shots.length,
    goals: goals.length,
    misses: misses.length,
    turnovers: turnovers.length,
    fouls: fouls.length,
    plays,
  };
};

const toPercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
};

const buildMetrics = (totals: Totals): MetricsTrendPoint['metrics'] => ({
  goalsVsShots: toPercent(totals.goals, totals.shots),
  goalsVsPlays: toPercent(totals.goals, totals.plays),
  missesVsPlays: toPercent(totals.misses, totals.plays),
  turnoversVsPlays: toPercent(totals.turnovers, totals.plays),
  foulsVsPlays: toPercent(totals.fouls, totals.plays),
  plays: totals.plays,
});

export const buildMetricsTrendData = (
  events: MatchEvent[],
  matchMetaById: Map<string, MatchMeta>,
  currentSeasonId?: string,
  currentSeasonName?: string
): MetricsTrendData | null => {
  const eventsByMatch = new Map<string, MatchEvent[]>();

  events.forEach((event) => {
    if (!event.matchId) return;
    const matchId = event.matchId;
    const bucket = eventsByMatch.get(matchId) ?? [];
    bucket.push(event);
    eventsByMatch.set(matchId, bucket);
  });

  if (eventsByMatch.size === 0) return null;

  const seasonTotals = new Map<string, { totals: Totals; meta: MatchMeta }>();
  const matchPoints: MetricsTrendPoint[] = [];

  eventsByMatch.forEach((matchEvents, matchId) => {
    const meta = matchMetaById.get(matchId);
    if (!meta) return;
    const totals = calculateTotals(matchEvents);
    const metrics = buildMetrics(totals);

    const isPastSeason = currentSeasonId && meta.seasonId && meta.seasonId !== currentSeasonId;
    if (isPastSeason) {
      const existing = seasonTotals.get(meta.seasonId);
      if (existing) {
        existing.totals.shots += totals.shots;
        existing.totals.goals += totals.goals;
        existing.totals.misses += totals.misses;
        existing.totals.turnovers += totals.turnovers;
        existing.totals.fouls += totals.fouls;
        existing.totals.plays += totals.plays;
      } else {
        seasonTotals.set(meta.seasonId, { totals, meta });
      }
      return;
    }

    matchPoints.push({
      id: matchId,
      label: meta.label,
      kind: 'match',
      sortKey: meta.sortKey,
      seasonId: meta.seasonId,
      seasonName: meta.seasonName,
      metrics,
    });
  });

  const seasonPoints: MetricsTrendPoint[] = [];
  seasonTotals.forEach(({ totals, meta }) => {
    seasonPoints.push({
      id: meta.seasonId ?? meta.matchId,
      label: meta.seasonName ?? 'Season',
      kind: 'season',
      sortKey: meta.seasonStart ? new Date(meta.seasonStart).getTime() : meta.sortKey,
      seasonId: meta.seasonId,
      seasonName: meta.seasonName,
      metrics: buildMetrics(totals),
    });
  });

  const orderedSeasons = seasonPoints.sort((a, b) => a.sortKey - b.sortKey);
  const orderedMatches = matchPoints.sort((a, b) => a.sortKey - b.sortKey);
  const points = currentSeasonId ? [...orderedSeasons, ...orderedMatches] : orderedMatches;

  if (points.length === 0) return null;

  return {
    points,
    currentSeasonId,
    currentSeasonName,
  };
};

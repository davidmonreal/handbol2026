import type { Match } from '@prisma/client';
import type { CreateGameEventInput } from '../schemas/game-event';

export const assertTeamUnlocked = (match: Match, teamId: string) => {
  const isHome = teamId === match.homeTeamId;
  const isAway = teamId === match.awayTeamId;
  const homeLocked = (match as { homeEventsLocked?: boolean }).homeEventsLocked ?? false;
  const awayLocked = (match as { awayEventsLocked?: boolean }).awayEventsLocked ?? false;
  if ((isHome && homeLocked) || (isAway && awayLocked)) {
    throw new Error('Events are locked for this team');
  }
};

export const assertMatchStarted = (match: Match) => {
  const hasLiveStart = !!match.realTimeFirstHalfStart;
  const hasVideoStart =
    match.firstHalfVideoStart !== null && match.firstHalfVideoStart !== undefined;
  if (!hasLiveStart && !hasVideoStart) {
    throw new Error('Match has not been started yet');
  }
};

export const computeFirstHalfBoundarySeconds = (match: Match): number | null => {
  return match.realTimeFirstHalfStart && match.realTimeSecondHalfStart
    ? Math.max(0, Math.floor((match.realTimeSecondHalfStart - match.realTimeFirstHalfStart) / 1000))
    : match.realTimeFirstHalfStart && match.realTimeFirstHalfEnd
      ? Math.max(0, Math.floor((match.realTimeFirstHalfEnd - match.realTimeFirstHalfStart) / 1000))
      : match.firstHalfVideoStart !== null &&
          match.firstHalfVideoStart !== undefined &&
          match.secondHalfVideoStart !== null &&
          match.secondHalfVideoStart !== undefined
        ? Math.max(0, match.secondHalfVideoStart - match.firstHalfVideoStart)
        : null;
};

export const assertSecondHalfStartedIfNeeded = (
  boundarySeconds: number | null,
  data: { timestamp: number; teamId: string; matchId: string },
  match: Match,
) => {
  if (
    boundarySeconds !== null &&
    data.timestamp > boundarySeconds &&
    !match.realTimeSecondHalfStart &&
    (match.secondHalfVideoStart === null || match.secondHalfVideoStart === undefined)
  ) {
    throw new Error('Second half has not started yet');
  }
};

export const getScorePatchForGoal = (
  match: Match,
  event: CreateGameEventInput | { teamId: string; subtype?: string | null; type: string },
  direction: 1 | -1,
): Partial<Match> | null => {
  if (event.type !== 'Shot' || event.subtype !== 'Goal') return null;

  if (event.teamId === match.homeTeamId) {
    const next = Math.max(0, match.homeScore + direction);
    return { homeScore: next };
  }

  if (event.teamId === match.awayTeamId) {
    const next = Math.max(0, match.awayScore + direction);
    return { awayScore: next };
  }

  return null;
};

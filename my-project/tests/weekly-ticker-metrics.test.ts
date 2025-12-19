import { describe, it, expect } from 'vitest';
import { buildWeeklyTickerMetrics } from '../src/services/weekly-ticker-metrics';
import type { EventWithRelations } from '../src/services/weekly-ticker-metrics';

const createMatch = () => {
  const homeTeam = {
    id: 'team-home',
    name: 'Home Team',
    category: 'Senior M',
    club: { id: 'club-home', name: 'Home Club' },
  };
  const awayTeam = {
    id: 'team-away',
    name: 'Away Team',
    category: 'Juvenil M',
    club: { id: 'club-away', name: 'Away Club' },
  };

  const match = {
    id: 'match-1',
    date: new Date('2024-01-01T00:00:00Z'),
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeScore: 0,
    awayScore: 0,
    isFinished: false,
    homeEventsLocked: false,
    awayEventsLocked: false,
    homeTeam,
    awayTeam,
  };

  return match as EventWithRelations['match'];
};

const buildGoalEvent = (
  match: EventWithRelations['match'],
  overrides: Partial<EventWithRelations>,
): EventWithRelations =>
  ({
    id: 'goal-event',
    matchId: match.id,
    timestamp: 0,
    teamId: match.homeTeamId,
    type: 'Shot',
    subtype: 'Goal',
    isCollective: false,
    hasOpposition: true,
    isCounterAttack: false,
    match,
    playerId: 'player-default',
    player: { id: 'player-default', name: 'Player Default' },
    activeGoalkeeperId: null,
    activeGoalkeeper: null,
    ...overrides,
  }) as EventWithRelations;

const buildShotEvent = (
  match: EventWithRelations['match'],
  overrides: Partial<EventWithRelations>,
): EventWithRelations =>
  ({
    id: 'shot-event',
    matchId: match.id,
    timestamp: 0,
    teamId: match.homeTeamId,
    type: 'Shot',
    subtype: 'Miss',
    isCollective: false,
    hasOpposition: true,
    isCounterAttack: false,
    match,
    playerId: 'player-default',
    player: { id: 'player-default', name: 'Player Default' },
    activeGoalkeeperId: null,
    activeGoalkeeper: null,
    ...overrides,
  }) as EventWithRelations;

const buildFoulEvent = (
  match: EventWithRelations['match'],
  overrides: Partial<EventWithRelations>,
): EventWithRelations =>
  ({
    id: 'foul-event',
    matchId: match.id,
    timestamp: 0,
    teamId: match.homeTeamId,
    type: 'Sanction',
    sanctionType: 'Foul',
    match,
    activeGoalkeeperId: null,
    activeGoalkeeper: null,
    ...overrides,
  }) as EventWithRelations;

describe('WeeklyTickerMetrics', () => {
  it('aggregates goal and foul data for ticker metrics', () => {
    const match = createMatch();
    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;
    const homeGoalkeeper = { id: 'gk-home', name: 'Home Keeper' };
    const awayGoalkeeper = { id: 'gk-away', name: 'Away Keeper' };

    const events: EventWithRelations[] = [
      buildGoalEvent(match, {
        id: 'goal-1',
        teamId: homeTeamId,
        playerId: 'player-home',
        player: { id: 'player-home', name: 'Alice' },
        isCollective: false,
        activeGoalkeeperId: awayGoalkeeper.id,
        activeGoalkeeper: awayGoalkeeper,
      }),
      buildGoalEvent(match, {
        id: 'goal-2',
        teamId: homeTeamId,
        playerId: 'player-home',
        player: { id: 'player-home', name: 'Alice' },
        isCollective: true,
        activeGoalkeeperId: awayGoalkeeper.id,
        activeGoalkeeper: awayGoalkeeper,
      }),
      buildGoalEvent(match, {
        id: 'goal-3',
        teamId: homeTeamId,
        playerId: 'player-home',
        player: { id: 'player-home', name: 'Alice' },
        isCollective: true,
      }),
      buildGoalEvent(match, {
        id: 'goal-4',
        teamId: awayTeamId,
        playerId: 'player-away',
        player: { id: 'player-away', name: 'Bob' },
        isCollective: false,
      }),
      buildGoalEvent(match, {
        id: 'goal-5',
        teamId: awayTeamId,
        playerId: 'player-away',
        player: { id: 'player-away', name: 'Bob' },
        isCollective: false,
      }),
      buildShotEvent(match, {
        id: 'home-saved-shot',
        teamId: homeTeamId,
        subtype: 'Save',
        activeGoalkeeperId: awayGoalkeeper.id,
        activeGoalkeeper: awayGoalkeeper,
      }),
      buildShotEvent(match, {
        id: 'away-save-1',
        teamId: awayTeamId,
        subtype: 'Save',
        activeGoalkeeperId: homeGoalkeeper.id,
        activeGoalkeeper: homeGoalkeeper,
      }),
      buildShotEvent(match, {
        id: 'away-save-2',
        teamId: awayTeamId,
        subtype: 'Save',
        activeGoalkeeperId: homeGoalkeeper.id,
        activeGoalkeeper: homeGoalkeeper,
      }),
      buildFoulEvent(match, { id: 'foul-1', teamId: homeTeamId }),
      buildFoulEvent(match, { id: 'foul-2', teamId: homeTeamId }),
      buildFoulEvent(match, { id: 'foul-3', teamId: awayTeamId }),
    ];

    const metrics = buildWeeklyTickerMetrics(events);

    expect(metrics.totalEvents).toBe(events.length);
    expect(metrics.topScorerOverall).toMatchObject({
      playerId: 'player-home',
      goals: 3,
    });
    expect(metrics.topIndividualScorer).toMatchObject({
      playerId: 'player-away',
      goals: 2,
    });
    expect(metrics.topScorersByCategory.map((entry) => entry.playerId)).toEqual([
      'player-away',
      'player-home',
    ]);
    expect(metrics.teamWithMostCollectiveGoals).toMatchObject({
      teamId: homeTeamId,
      count: 2,
    });
    expect(metrics.teamWithMostFouls).toMatchObject({
      teamId: awayTeamId,
      count: 2,
    });
    expect(metrics.bestGoalkeeper).toMatchObject({
      playerId: homeGoalkeeper.id,
      savePercentage: 100,
      saves: 2,
      shotsFaced: 2,
    });
    expect(metrics.mostEfficientTeam).toMatchObject({
      teamId: homeTeamId,
      percentage: 75,
    });
    expect(metrics.mostAttackingTeam).toMatchObject({
      teamId: homeTeamId,
      percentage: 50,
    });
  });

  it('ignores events with missing context but still tracks totals', () => {
    const match = createMatch();

    const events: EventWithRelations[] = [
      buildGoalEvent(match, {
        id: 'orphan-player',
        playerId: null,
        player: null,
        isCollective: true,
      }),
      buildGoalEvent(match, {
        id: 'unknown-team',
        teamId: 'unknown',
        playerId: 'ghost',
        player: { id: 'ghost', name: 'Nobody' },
      }),
      buildFoulEvent(match, { id: 'foul-unknown', teamId: 'unknown' }),
    ];

    const metrics = buildWeeklyTickerMetrics(events);

    expect(metrics.totalEvents).toBe(3);
    expect(metrics.topScorerOverall).toBeNull();
    expect(metrics.topIndividualScorer).toBeNull();
    expect(metrics.topScorersByCategory).toEqual([]);
    expect(metrics.teamWithMostCollectiveGoals).toMatchObject({
      teamId: match.homeTeamId,
      count: 1,
    });
    expect(metrics.teamWithMostFouls).toBeNull();
    expect(metrics.bestGoalkeeper).toBeNull();
    expect(metrics.mostEfficientTeam).toMatchObject({
      teamId: match.homeTeamId,
      percentage: 100,
    });
    expect(metrics.mostAttackingTeam).toMatchObject({
      teamId: match.homeTeamId,
      percentage: 100,
    });
  });
});

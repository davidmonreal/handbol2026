/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { GameEventRepository } from '../src/repositories/game-event-repository';
import { MatchRepository } from '../src/repositories/match-repository';
import { GameEventService } from '../src/services/game-event-service';
import { MatchService } from '../src/services/match-service';
import { cleanupTestData } from './utils/cleanup-test-data';

describe('Integration: game events mutate match score atomically', () => {
  const gameEventRepository = new GameEventRepository();
  const matchRepository = new MatchRepository();
  const gameEventService = new GameEventService(gameEventRepository, matchRepository);
  const matchService = new MatchService(matchRepository);

  let seasonId: string;
  let clubId: string;
  const createdMatches: string[] = [];
  const createdTeams: string[] = [];

  beforeAll(async () => {
    const season = await prisma.season.create({
      data: {
        name: `Season-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const club = await prisma.club.create({
      data: {
        name: `Club-${Date.now()}`,
      },
    });

    seasonId = season.id;
    clubId = club.id;
  });

  afterAll(async () => {
    if (createdMatches.length) {
      await prisma.gameEvent.deleteMany({ where: { matchId: { in: createdMatches } } });
      await prisma.match.deleteMany({ where: { id: { in: createdMatches } } });
    }
    if (createdTeams.length) {
      await prisma.team.deleteMany({ where: { id: { in: createdTeams } } });
    }
    if (clubId) {
      await prisma.club.delete({ where: { id: clubId } }).catch(() => null);
    }
    if (seasonId) {
      await prisma.season.delete({ where: { id: seasonId } }).catch(() => null);
    }
    await cleanupTestData();
  });

  const createMatch = async () => {
    const homeTeam = await prisma.team.create({
      data: {
        name: `Home-${Date.now()}`,
        clubId,
        seasonId,
      },
    });
    const awayTeam = await prisma.team.create({
      data: {
        name: `Away-${Date.now()}`,
        clubId,
        seasonId,
      },
    });

    createdTeams.push(homeTeam.id, awayTeam.id);

    const match = await prisma.match.create({
      data: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        date: new Date(),
      },
    });

    createdMatches.push(match.id);

    return { match, homeTeam, awayTeam };
  };

  it('updates match score when goal events are created and deleted', { timeout: 15000 }, async () => {
    const { match, homeTeam, awayTeam } = await createMatch();

    const initial = await matchRepository.findById(match.id);
    expect(initial?.homeScore).toBe(0);
    expect(initial?.awayScore).toBe(0);

    const homeGoal = await gameEventService.create({
      matchId: match.id,
      timestamp: 10,
      teamId: homeTeam.id,
      type: 'Shot',
      subtype: 'Goal',
      position: 'LW',
      distance: '6M',
    });

    const afterHomeGoal = await matchRepository.findById(match.id);
    expect(afterHomeGoal?.homeScore).toBe(1);
    expect(afterHomeGoal?.awayScore).toBe(0);

    await gameEventService.create({
      matchId: match.id,
      timestamp: 20,
      teamId: awayTeam.id,
      type: 'Shot',
      subtype: 'Goal',
      position: 'RW',
      distance: '9M',
    });

    const afterAwayGoal = await matchRepository.findById(match.id);
    expect(afterAwayGoal?.homeScore).toBe(1);
    expect(afterAwayGoal?.awayScore).toBe(1);

    await gameEventService.delete(homeGoal.id);

    const afterDelete = await matchRepository.findById(match.id);
    expect(afterDelete?.homeScore).toBe(0);
    expect(afterDelete?.awayScore).toBe(1);
  });

  it('deleting a match removes its game events', async () => {
    const { match, homeTeam } = await createMatch();

    const event = await gameEventRepository.create({
      matchId: match.id,
      timestamp: 5,
      teamId: homeTeam.id,
      type: 'Shot',
      subtype: 'Goal',
      position: 'CB',
      distance: '6M',
    });

    const eventsBeforeDelete = await prisma.gameEvent.count({ where: { matchId: match.id } });
    expect(eventsBeforeDelete).toBe(1);

    await matchService.delete(match.id);

    const eventsAfterDelete = await prisma.gameEvent.count({ where: { id: event.id } });
    expect(eventsAfterDelete).toBe(0);
  });

  it('does NOT modify score for finished matches when creating or deleting goals', async () => {
    const { match, homeTeam } = await createMatch();

    // Manually mark finished with a manual score
    const finished = await matchRepository.update(match.id, {
      isFinished: true,
      homeScore: 33,
      awayScore: 26,
    });

    // Create goal should NOT change manual score
    await gameEventService.create({
      matchId: finished.id,
      timestamp: 15,
      teamId: homeTeam.id,
      type: 'Shot',
      subtype: 'Goal',
      position: 'LW',
      distance: '6M',
    });

    const afterCreate = await matchRepository.findById(finished.id);
    expect(afterCreate?.homeScore).toBe(33);
    expect(afterCreate?.awayScore).toBe(26);

    // Delete goal should also NOT change manual score
    const events = await gameEventRepository.findByMatchId(finished.id);
    await Promise.all(events.map(e => gameEventService.delete(e.id)));

    const afterDelete = await matchRepository.findById(finished.id);
    expect(afterDelete?.homeScore).toBe(33);
    expect(afterDelete?.awayScore).toBe(26);
  });
});

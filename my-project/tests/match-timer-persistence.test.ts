import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import prisma from '../src/lib/prisma';
import { MatchRepository } from '../src/repositories/match-repository';
import { MatchService } from '../src/services/match-service';
import { cleanupTestData } from './utils/cleanup-test-data';

describe('Integration: Match Timer Persistence', () => {
  const matchRepository = new MatchRepository();
  const matchService = new MatchService(matchRepository);

  let seasonId: string;
  let clubId: string;
  const createdMatches: string[] = [];
  const createdTeams: string[] = [];
  const timestampSuffix = Date.now();

  const cleanupEntities = async () => {
    if (createdMatches.length) {
      await prisma.match.deleteMany({ where: { id: { in: createdMatches } } });
      createdMatches.length = 0;
    }
    if (createdTeams.length) {
      await prisma.team.deleteMany({ where: { id: { in: createdTeams } } });
      createdTeams.length = 0;
    }
  };

  beforeAll(async () => {
    const season = await prisma.season.create({
      data: {
        name: `TimerSeason-${timestampSuffix}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const club = await prisma.club.create({
      data: {
        name: `TimerClub-${timestampSuffix}`,
      },
    });

    seasonId = season.id;
    clubId = club.id;
  });

  afterEach(async () => {
    await cleanupEntities();
  });

  afterAll(async () => {
    await cleanupEntities();
    if (clubId) {
      await prisma.club.delete({ where: { id: clubId } }).catch(() => null);
    }
    if (seasonId) {
      await prisma.season.delete({ where: { id: seasonId } }).catch(() => null);
    }
    await cleanupTestData();
  });

  const createMatch = async () => {
    const now = Date.now();
    const homeTeam = await prisma.team.create({
      data: {
        name: `TimerHome-${now}`,
        clubId,
        seasonId,
      },
    });
    const awayTeam = await prisma.team.create({
      data: {
        name: `TimerAway-${now}`,
        clubId,
        seasonId,
      },
    });

    createdTeams.push(homeTeam.id, awayTeam.id);

    const match = await matchService.create({
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      date: new Date(),
    });

    createdMatches.push(match.id);

    return { match };
  };

  it('persists realTimeFirstHalfStart when updated', async () => {
    const { match } = await createMatch();
    const startTimeResult = Date.now();

    // 1. Verify initial state is null
    expect(match.realTimeFirstHalfStart).toBeNull();

    // 2. Update with start time
    await matchService.update(match.id, {
      realTimeFirstHalfStart: startTimeResult,
      homeEventsLocked: false,
      awayEventsLocked: false,
    });

    // 3. Fetch from DB and verify
    const updatedMatch = await matchService.findById(match.id);
    expect(updatedMatch?.realTimeFirstHalfStart).toBe(startTimeResult);
  });

  it('persists realTimeSecondHalfStart when updated', async () => {
    const { match } = await createMatch();
    const firstHalfStart = Date.now() - 3600000; // 1 hour ago
    const secondHalfStart = Date.now();

    // 1. Update first and second half
    await matchService.update(match.id, {
      realTimeFirstHalfStart: firstHalfStart,
      realTimeSecondHalfStart: secondHalfStart,
      homeEventsLocked: false,
      awayEventsLocked: false,
    });

    // 2. Fetch from DB and verify
    const updatedMatch = await matchService.findById(match.id);
    expect(updatedMatch?.realTimeFirstHalfStart).toBe(firstHalfStart);
    expect(updatedMatch?.realTimeSecondHalfStart).toBe(secondHalfStart);
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { cleanupTestData } from '../utils/cleanup-test-data';

const prisma = new PrismaClient();

describe('Full Application Lifecycle Integration Test', () => {
  // Test Data IDs
  let clubId: string;
  let seasonId: string;
  let homeTeamId: string;
  let awayTeamId: string;
  let playerId: string;
  let matchId: string;
  const runId = Date.now().toString();

  // Cleanup before and after
  const cleanup = async () => {
    // Delete in reverse order of dependencies
    await prisma.gameEvent.deleteMany({
      where: {
        OR: [
          matchId ? { matchId } : undefined,
          homeTeamId ? { teamId: homeTeamId } : undefined,
          awayTeamId ? { teamId: awayTeamId } : undefined,
        ].filter(Boolean) as unknown as { matchId: string }[],
      },
    });
    await prisma.match.deleteMany({
      where: {
        OR: [
          matchId ? { id: matchId } : undefined,
          homeTeamId ? { homeTeamId } : undefined,
          awayTeamId ? { awayTeamId } : undefined,
        ].filter(Boolean) as unknown as { id?: string; homeTeamId?: string; awayTeamId?: string }[],
      },
    });
    await prisma.playerTeamSeason.deleteMany({
      where: { teamId: { in: [homeTeamId, awayTeamId] } },
    });
    await prisma.team.deleteMany({ where: { id: { in: [homeTeamId, awayTeamId] } } });
    await prisma.player.deleteMany({ where: { id: playerId } });
    await prisma.season.deleteMany({ where: { id: seasonId } });
    await prisma.club.deleteMany({ where: { id: clubId } });
  };

  beforeAll(async () => {
    // Ensure clean state if possible, though we rely on unique IDs usually
  });

  afterAll(async () => {
    await cleanup();
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('1. Club Management', () => {
    it('should create a new club', async () => {
      const res = await request(app)
        .post('/api/clubs')
        .send({ name: `Test FL Club ${runId}` });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(`Test FL Club ${runId}`);
      clubId = res.body.id;
    });
  });

  describe('2. Season Management', () => {
    it('should create a new season', async () => {
      const res = await request(app)
        .post('/api/seasons')
        .send({
          name: `Test FL Season ${runId}`,
          startDate: '2025-09-01T00:00:00.000Z',
          endDate: '2026-07-31T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      seasonId = res.body.id;
    });
  });

  describe('3. Team Management', () => {
    it('should create home team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          name: `Test FL Home ${runId}`,
          category: 'SENIOR',
          isMyTeam: true,
          clubId,
          seasonId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      homeTeamId = res.body.id;
    });

    it('should create away team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          name: `Test FL Away ${runId}`,
          category: 'SENIOR',
          isMyTeam: false,
          clubId,
          seasonId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      awayTeamId = res.body.id;
    });
  });

  describe('4. Player Management', () => {
    it('should create a player', async () => {
      const res = await request(app)
        .post('/api/players')
        .send({
          name: `Test FL Player ${runId}`,
          number: 10,
          handedness: 'RIGHT',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      playerId = res.body.id;
    });

    it('should assign player to home team', async () => {
      const res = await request(app).post(`/api/teams/${homeTeamId}/players`).send({
        playerId,
        role: 'Player',
      });

      expect(res.status).toBe(201);

      // Verify assignment
      const teamRes = await request(app).get(`/api/teams/${homeTeamId}`);
      const playerInTeam = teamRes.body.players.find(
        (p: { player: { id: string } }) => p.player.id === playerId,
      );
      expect(playerInTeam).toBeDefined();
    });
  });

  describe('5. Match Management', () => {
    it('should create a match', async () => {
      const res = await request(app).post('/api/matches').send({
        date: new Date().toISOString(),
        homeTeamId,
        awayTeamId,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      matchId = res.body.id;

      // Start the official clock right away so event creation is permitted.
      const calibration = await request(app)
        .patch(`/api/matches/${matchId}`)
        .send({ realTimeFirstHalfStart: Date.now() });
      expect(calibration.status).toBe(200);
    });
  });

  describe('6. Game Events & Statistics', () => {
    it('should create a Goal with full context', async () => {
      const res = await request(app).post('/api/game-events').send({
        matchId,
        timestamp: 60,
        playerId,
        teamId: homeTeamId,
        type: 'Shot',
        subtype: 'Goal',
        position: 'CB',
        distance: '9M',
        goalZone: 'TR',
        isCollective: true,
        hasOpposition: true,
        isCounterAttack: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.isCollective).toBe(true);
      expect(res.body.hasOpposition).toBe(true);
      expect(res.body.isCounterAttack).toBe(false);
    });

    it('should create a Sanction', async () => {
      const res = await request(app).post('/api/game-events').send({
        matchId,
        timestamp: 120,
        playerId,
        teamId: homeTeamId,
        type: 'Sanction',
        subtype: 'Yellow',
        sanctionType: 'Yellow',
      });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('Sanction');
    });

    it('should create a Turnover', async () => {
      const res = await request(app).post('/api/game-events').send({
        matchId,
        timestamp: 180,
        playerId,
        teamId: homeTeamId,
        type: 'Turnover',
        subtype: 'Pass',
      });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('Turnover');
    });

    it('should verify match statistics and data integrity', async () => {
      const res = await request(app).get(`/api/game-events/match/${matchId}`);

      expect(res.status).toBe(200);
      const events = res.body;
      expect(events).toHaveLength(3);

      // Verify Goal Event Data
      const goalEvent = events.find((e: { type: string }) => e.type === 'Shot');
      expect(goalEvent).toBeDefined();
      expect(goalEvent.isCollective).toBe(true);
      expect(goalEvent.hasOpposition).toBe(true);
      expect(goalEvent.goalZone).toBe('TR');
      expect(goalEvent.playerId).toBe(playerId);

      // Verify Score Update (Home Team should have 1 goal)
      const matchRes = await request(app).get(`/api/matches/${matchId}`);
      expect(matchRes.body.homeScore).toBe(1);
      expect(matchRes.body.awayScore).toBe(0);
    });
  });
});

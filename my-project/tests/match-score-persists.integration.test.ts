import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient, Club, Season, Team } from '@prisma/client';

const prisma = new PrismaClient();

describe.sequential('Match score persistence', () => {
  let season: Season;
  let clubA: Club;
  let clubB: Club;
  let teamA: Team;
  let teamB: Team;

  beforeAll(async () => {
    season = await prisma.season.create({
      data: {
        name: `Season-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    clubA = await prisma.club.create({ data: { name: `ClubA-${Date.now()}` } });
    clubB = await prisma.club.create({ data: { name: `ClubB-${Date.now()}` } });

    teamA = await prisma.team.create({
      data: {
        name: `TeamA-${Date.now()}`,
        category: 'Senior M',
        clubId: clubA.id,
        seasonId: season.id,
        isMyTeam: false,
      },
    });

    teamB = await prisma.team.create({
      data: {
        name: `TeamB-${Date.now()}`,
        category: 'Senior M',
        clubId: clubB.id,
        seasonId: season.id,
        isMyTeam: false,
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.match.deleteMany({ where: { homeTeamId: teamA.id } });
      await prisma.team.deleteMany({ where: { id: { in: [teamA.id, teamB.id] } } });
      await prisma.club.deleteMany({ where: { id: { in: [clubA.id, clubB.id] } } });
      await prisma.season.deleteMany({ where: { id: season.id } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('persists finished match scores on update and getAll', async () => {
    const createRes = await request(app).post('/api/matches').send({
      date: new Date().toISOString(),
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
    });
    expect(createRes.status).toBe(201);

    const matchId = createRes.body.id as string;

    const updateRes = await request(app)
      .put(`/api/matches/${matchId}`)
      .send({ isFinished: true, homeScore: 31, awayScore: 29 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.homeScore).toBe(31);
    expect(updateRes.body.awayScore).toBe(29);

    const getRes = await request(app).get(`/api/matches/${matchId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.homeScore).toBe(31);
    expect(getRes.body.awayScore).toBe(29);

    const listRes = await request(app).get('/api/matches');
    expect(listRes.status).toBe(200);
    const matchFromList = Array.isArray(listRes.body)
      ? listRes.body.find((m: { id: string }) => m.id === matchId)
      : undefined;
    expect(matchFromList?.homeScore).toBe(31);
    expect(matchFromList?.awayScore).toBe(29);
  });
});

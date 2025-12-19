import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { PrismaClient, Club, Season, Team } from '@prisma/client';

const prisma = new PrismaClient();
const uniqueName = (label: string) =>
  `Test-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const created = {
  clubs: new Set<string>(),
  seasons: new Set<string>(),
  teams: new Set<string>(),
  matches: new Set<string>(),
};

const registerClub = (club: Club) => created.clubs.add(club.id);
const registerSeason = (season: Season) => created.seasons.add(season.id);
const registerTeam = (team: Team) => created.teams.add(team.id);
const registerMatch = (matchId: string) => created.matches.add(matchId);

const createSeason = async (label: string) => {
  const season = await prisma.season.create({
    data: {
      name: uniqueName(label),
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  registerSeason(season);
  return season;
};

const createClub = async (label: string) => {
  const club = await prisma.club.create({
    data: {
      name: uniqueName(label),
    },
  });
  registerClub(club);
  return club;
};

const createTeam = async (label: string, clubId: string, seasonId: string) => {
  const team = await prisma.team.create({
    data: {
      name: uniqueName(label),
      category: 'Cadet M',
      clubId,
      seasonId,
      isMyTeam: false,
    },
  });
  registerTeam(team);
  return team;
};

afterAll(async () => {
  try {
    if (created.matches.size > 0) {
      const matchIds = Array.from(created.matches);
      await prisma.gameEvent.deleteMany({ where: { matchId: { in: matchIds } } });
      await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
    }

    if (created.teams.size > 0) {
      const teamIds = Array.from(created.teams);
      await prisma.playerTeamSeason.deleteMany({ where: { teamId: { in: teamIds } } });
      await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
    }

    if (created.seasons.size > 0) {
      await prisma.season.deleteMany({ where: { id: { in: Array.from(created.seasons) } } });
    }

    if (created.clubs.size > 0) {
      await prisma.club.deleteMany({ where: { id: { in: Array.from(created.clubs) } } });
    }
  } finally {
    await prisma.$disconnect();
  }
});

describe.sequential('Club CRUD integration', () => {
  it('performs full CRUD flow for clubs via the API', async () => {
    const clubName = uniqueName('CRUD-Club');
    const createRes = await request(app).post('/api/clubs').send({ name: clubName });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe(clubName);

    const clubId = createRes.body.id as string;
    created.clubs.add(clubId);

    const listRes = await request(app).get('/api/clubs');
    expect(listRes.status).toBe(200);
    const existsOnList = Array.isArray(listRes.body)
      ? listRes.body.some((club: Club) => club.id === clubId)
      : false;
    expect(existsOnList).toBe(true);

    const updatedName = `${clubName}-Updated`;
    const updateRes = await request(app).put(`/api/clubs/${clubId}`).send({ name: updatedName });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe(updatedName);

    const deleteRes = await request(app).delete(`/api/clubs/${clubId}`);
    expect(deleteRes.status).toBe(204);
    created.clubs.delete(clubId);

    const fetchDeleted = await request(app).get(`/api/clubs/${clubId}`);
    expect(fetchDeleted.status).toBe(404);
  }, 15000);
});

describe.sequential('Team CRUD integration', () => {
  let supportingClub: Club;
  let supportingSeason: Season;

  beforeAll(async () => {
    supportingClub = await createClub('TeamBaseClub');
    supportingSeason = await createSeason('TeamBaseSeason');
  });

  it('creates, reads, updates, and deletes teams', async () => {
    const payload = {
      name: uniqueName('CRUD-Team'),
      category: 'Cadet M',
      clubId: supportingClub.id,
      seasonId: supportingSeason.id,
      isMyTeam: false,
    };

    const createRes = await request(app).post('/api/teams').send(payload);
    expect(createRes.status).toBe(201);
    const teamId = createRes.body.id;
    created.teams.add(teamId);

    const getRes = await request(app).get(`/api/teams/${teamId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe(payload.name);

    const updatedName = `${payload.name}-Updated`;
    const updateRes = await request(app)
      .put(`/api/teams/${teamId}`)
      .send({ name: updatedName, isMyTeam: true });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe(updatedName);
    expect(updateRes.body.isMyTeam).toBe(true);

    const listRes = await request(app).get('/api/teams');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const deleteRes = await request(app).delete(`/api/teams/${teamId}`);
    expect(deleteRes.status).toBe(204);
    created.teams.delete(teamId);

    const fetchDeleted = await request(app).get(`/api/teams/${teamId}`);
    expect(fetchDeleted.status).toBe(404);
  }, 15000);
});

describe.sequential('Match CRUD integration', () => {
  let season: Season;
  let homeClub: Club;
  let awayClub: Club;
  let homeTeam: Team;
  let awayTeam: Team;

  beforeAll(async () => {
    season = await createSeason('MatchSeason');
    homeClub = await createClub('MatchHomeClub');
    awayClub = await createClub('MatchAwayClub');
    homeTeam = await createTeam('MatchHomeTeam', homeClub.id, season.id);
    awayTeam = await createTeam('MatchAwayTeam', awayClub.id, season.id);
  });

  it('runs CRUD flow for matches and cleans up related data', async () => {
    const payload = {
      date: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    };

    const createRes = await request(app).post('/api/matches').send(payload);
    expect(createRes.status).toBe(201);
    const matchId = createRes.body.id as string;
    registerMatch(matchId);

    const getRes = await request(app).get(`/api/matches/${matchId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.homeTeamId).toBe(homeTeam.id);
    expect(getRes.body.awayTeamId).toBe(awayTeam.id);

    const updateRes = await request(app)
      .put(`/api/matches/${matchId}`)
      .send({ isFinished: true, videoUrl: 'https://example.com/video.mp4' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.isFinished).toBe(true);
    expect(updateRes.body.videoUrl).toBe('https://example.com/video.mp4');

    const listRes = await request(app).get('/api/matches');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const deleteRes = await request(app).delete(`/api/matches/${matchId}`);
    expect(deleteRes.status).toBe(204);
    created.matches.delete(matchId);

    const fetchDeleted = await request(app).get(`/api/matches/${matchId}`);
    expect(fetchDeleted.status).toBe(404);
  }, 15000);
});

import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient, Handedness } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();
const createdPlayerIds: string[] = [];
const createdTeamIds: string[] = [];
const createdClubIds: string[] = [];
const createdSeasonIds: string[] = [];

vi.setTimeout(15000);

const uniqueName = (label: string) =>
  `Pcrud-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createTeamForCascadeCheck = async () => {
  const season = await prisma.season.create({
    data: {
      name: uniqueName('Cascade Season'),
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  createdSeasonIds.push(season.id);

  const club = await prisma.club.create({
    data: {
      name: uniqueName('Cascade Club'),
    },
  });
  createdClubIds.push(club.id);

  const team = await prisma.team.create({
    data: {
      name: uniqueName('Cascade Team'),
      clubId: club.id,
      seasonId: season.id,
    },
  });
  createdTeamIds.push(team.id);

  return team;
};

afterAll(async () => {
  if (createdPlayerIds.length > 0) {
    await prisma.player.deleteMany({
      where: { id: { in: createdPlayerIds } },
    });
  }
  if (createdTeamIds.length > 0) {
    await prisma.playerTeamSeason.deleteMany({
      where: { teamId: { in: createdTeamIds } },
    });
    await prisma.team.deleteMany({
      where: { id: { in: createdTeamIds } },
    });
  }
  if (createdClubIds.length > 0) {
    await prisma.club.deleteMany({ where: { id: { in: createdClubIds } } });
  }
  if (createdSeasonIds.length > 0) {
    await prisma.season.deleteMany({ where: { id: { in: createdSeasonIds } } });
  }
  await prisma.$disconnect();
});

describe.sequential('Player CRUD integration', () => {
  it('creates and retrieves a player by id', async () => {
    const payload = {
      name: uniqueName('Integration Player'),
      number: 42,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };

    const createRes = await request(app).post('/api/players').send(payload);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject(payload);
    createdPlayerIds.push(createRes.body.id);

    const getRes = await request(app).get(`/api/players/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject(payload);
  });

  it('updates an existing player', async () => {
    const payload = {
      name: uniqueName('Update Player'),
      number: 8,
      handedness: Handedness.LEFT,
      isGoalkeeper: false,
    };
    const createRes = await request(app).post('/api/players').send(payload);
    expect(createRes.status).toBe(201);
    createdPlayerIds.push(createRes.body.id);

    const updateRes = await request(app)
      .put(`/api/players/${createRes.body.id}`)
      .send({ number: 99, isGoalkeeper: true });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.number).toBe(99);
    expect(updateRes.body.isGoalkeeper).toBe(true);
  });

  it('lists players with pagination metadata and search filtering', async () => {
    const marker = uniqueName('Searchable');
    const createRes = await request(app)
      .post('/api/players')
      .send({ name: marker, number: 31, handedness: Handedness.RIGHT, isGoalkeeper: false });
    expect(createRes.status).toBe(201);
    createdPlayerIds.push(createRes.body.id);

    const listRes = await request(app).get(`/api/players?skip=0&take=5&search=${marker}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.total).toBeGreaterThanOrEqual(1);
    const found = listRes.body.data.some(
      (player: { id: string; name: string }) => player.id === createRes.body.id,
    );
    expect(found).toBe(true);
  });

  it('deletes players and cascades team assignments', async () => {
    const payload = {
      name: uniqueName('Deletable Player'),
      number: 73,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const createRes = await request(app).post('/api/players').send(payload);
    expect(createRes.status).toBe(201);
    const playerId = createRes.body.id;
    createdPlayerIds.push(playerId);

    const team = (await prisma.team.findFirst()) ?? (await createTeamForCascadeCheck());

    await prisma.playerTeamSeason.create({
      data: {
        playerId,
        teamId: team.id,
        role: 'INTEGRATION-TEST',
      },
    });

    const deleteRes = await request(app).delete(`/api/players/${playerId}`);
    expect(deleteRes.status).toBe(204);

    const playerInDb = await prisma.player.findUnique({ where: { id: playerId } });
    expect(playerInDb).toBeNull();

    const assignments = await prisma.playerTeamSeason.count({ where: { playerId } });
    expect(assignments).toBe(0);

    // Remove from cleanup list - already deleted
    createdPlayerIds.splice(
      createdPlayerIds.findIndex((id) => id === playerId),
      1,
    );
  });
});

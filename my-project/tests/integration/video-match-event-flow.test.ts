/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { isApiAvailable } from '../utils/api-availability';
import { PLAYER_POSITION } from '../../src/types/player-position';
import { testClubName, testPlayerName, testSeasonName, testTeamName } from '../utils/test-name';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

const createdPlayerIds: string[] = [];
const createdTeamIds: string[] = [];
const createdClubIds: string[] = [];
const createdSeasonIds: string[] = [];

const createTeamWithPlayer = async (label: string) => {
  const now = Date.now();
  const season = await prisma.season.create({
    data: {
      name: testSeasonName(`video-event-flow-${label}`, String(now)),
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  createdSeasonIds.push(season.id);

  const club = await prisma.club.create({
    data: {
      name: testClubName(`video-event-flow-${label}`, String(now)),
    },
  });
  createdClubIds.push(club.id);

  const team = await prisma.team.create({
    data: {
      name: testTeamName(`video-event-flow-${label}`, String(now)),
      clubId: club.id,
      seasonId: season.id,
      isMyTeam: label === 'Home',
    },
  });
  createdTeamIds.push(team.id);

  const player = await prisma.player.create({
    data: {
      name: testPlayerName(`video-event-flow-${label}`, String(now)),
      number: Math.floor(Math.random() * 80) + 1,
    },
  });
  createdPlayerIds.push(player.id);

  await prisma.playerTeamSeason.create({
    data: {
      playerId: player.id,
      teamId: team.id,
      position: label === 'Home' ? PLAYER_POSITION.CENTRAL : PLAYER_POSITION.PIVOT,
    },
  });

  return { team, playerId: player.id };
};

describe('Integration Tests: Video Match Event Flow', () => {
  let apiAvailable = false;
  let createdMatchId: string | null = null;
  let testTeamId: string;
  let testPlayerId: string;

  beforeAll(async () => {
    apiAvailable = await isApiAvailable(API_URL);
    if (!apiAvailable) {
      return;
    }

    const home = await createTeamWithPlayer('Home');
    const away = await createTeamWithPlayer('Away');

    const match = await prisma.match.create({
      data: {
        date: new Date(),
        homeTeamId: home.team.id,
        awayTeamId: away.team.id,
        isFinished: false,
        homeEventsLocked: false,
        awayEventsLocked: false,
        realTimeFirstHalfStart: null,
        firstHalfVideoStart: 120,
        secondHalfVideoStart: null,
      },
    });

    createdMatchId = match.id;
    testTeamId = home.team.id;
    testPlayerId = home.playerId;
  });

  afterAll(async () => {
    if (!apiAvailable) {
      await prisma.$disconnect();
      return;
    }

    if (createdMatchId) {
      await prisma.gameEvent.deleteMany({ where: { matchId: createdMatchId } });
      await prisma.match.delete({ where: { id: createdMatchId } });
    }

    if (createdTeamIds.length) {
      await prisma.playerTeamSeason.deleteMany({ where: { teamId: { in: createdTeamIds } } });
      await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
    }

    if (createdPlayerIds.length) {
      await prisma.player.deleteMany({ where: { id: { in: createdPlayerIds } } });
    }

    if (createdClubIds.length) {
      await prisma.club.deleteMany({ where: { id: { in: createdClubIds } } });
    }

    if (createdSeasonIds.length) {
      await prisma.season.deleteMany({ where: { id: { in: createdSeasonIds } } });
    }

    await prisma.$disconnect();
  });

  it('should create a game event for a video-calibrated match', async () => {
    if (!apiAvailable || !createdMatchId) return;

    const newEvent = {
      matchId: createdMatchId,
      timestamp: 42,
      videoTimestamp: 165,
      playerId: testPlayerId,
      teamId: testTeamId,
      type: 'Shot',
      subtype: 'Goal',
      position: 'CB',
      distance: '6M',
      isCollective: false,
      goalZone: 'MM',
    };

    const createResponse = await fetch(`${API_URL}/api/game-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });

    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();
    expect(createdEvent.id).toBeDefined();
    expect(createdEvent.videoTimestamp).toBe(165);

    const dbEvent = await prisma.gameEvent.findUnique({
      where: { id: createdEvent.id },
    });
    expect(dbEvent).toBeDefined();
    expect(dbEvent?.videoTimestamp).toBe(165);
  });

  it('should update and delete a video game event via API', async () => {
    if (!apiAvailable || !createdMatchId) return;
    const newEvent = {
      matchId: createdMatchId,
      timestamp: 60,
      videoTimestamp: 180,
      playerId: testPlayerId,
      teamId: testTeamId,
      type: 'Shot',
      subtype: 'Goal',
      position: 'CB',
      distance: '6M',
      isCollective: false,
      goalZone: 'MM',
    };

    const createResponse = await fetch(`${API_URL}/api/game-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });
    expect(createResponse.ok).toBe(true);
    const createdEvent = await createResponse.json();

    const updateResponse = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: 72,
        videoTimestamp: 192,
        subtype: 'Save',
      }),
    });
    expect(updateResponse.ok).toBe(true);

    const updatedEventRes = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`);
    expect(updatedEventRes.ok).toBe(true);
    const updatedEvent = await updatedEventRes.json();
    expect(updatedEvent.timestamp).toBe(72);
    expect(updatedEvent.videoTimestamp).toBe(192);
    expect(updatedEvent.subtype).toBe('Save');

    const deleteResponse = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.ok).toBe(true);

    const fetchDeleted = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`);
    expect(fetchDeleted.status).toBe(404);
  });
});

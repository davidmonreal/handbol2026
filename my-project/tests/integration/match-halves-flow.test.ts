/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { isApiAvailable } from '../utils/api-availability';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
// Use uneven half lengths so we prove the system accepts whatever the referee stops at.
const FIRST_HALF_DURATION_SECONDS = 32 * 60 + 12; // 32:12
const SECOND_HALF_DURATION_SECONDS = 31 * 60 + 48; // 31:48
const ms = (seconds: number) => seconds * 1000;

describe('Integration: full match timeline', () => {
  let apiAvailable = false;
  let matchId: string;
  let homeTeamId: string;
  let awayTeamId: string;
  let homePlayerId: string;
  let awayPlayerId: string;
  const createdEventIds: string[] = [];

  beforeAll(async () => {
    apiAvailable = await isApiAvailable(API_URL);
    if (!apiAvailable) {
      return;
    }

    const homeTeam = await prisma.team.findFirst({
      where: { players: { some: {} } },
      include: { players: { take: 1, include: { player: true } } },
    });
    const awayTeam = await prisma.team.findFirst({
      where: {
        id: { not: homeTeam?.id || undefined },
        players: { some: {} },
      },
      include: { players: { take: 1, include: { player: true } } },
    });

    if (!homeTeam || !awayTeam || !homeTeam.players.length || !awayTeam.players.length) {
      throw new Error('Seed data required: need two teams with at least one player each.');
    }

    homeTeamId = homeTeam.id;
    awayTeamId = awayTeam.id;
    homePlayerId = homeTeam.players[0].player.id;
    awayPlayerId = awayTeam.players[0].player.id;

    const matchResponse = await fetch(`${API_URL}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString(),
        homeTeamId,
        awayTeamId,
        isFinished: false,
      }),
    });
    expect(matchResponse.ok).toBe(true);
    const match = await matchResponse.json();
    matchId = match.id;
  });

  afterAll(async () => {
    if (!apiAvailable) {
      await prisma.$disconnect();
      return;
    }

    if (createdEventIds.length) {
      await prisma.gameEvent.deleteMany({ where: { id: { in: createdEventIds } } });
    }
    if (matchId) {
      await prisma.gameEvent.deleteMany({ where: { matchId } });
      await prisma.match.delete({ where: { id: matchId } });
    }
    await prisma.$disconnect();
  });

  const patchMatch = async (data: Record<string, number>) => {
    const response = await fetch(`${API_URL}/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    expect(response.ok).toBe(true);
  };

  const createEvent = async (payload: any) => {
    const response = await fetch(`${API_URL}/api/game-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(response.ok).toBe(true);
    const created = await response.json();
    createdEventIds.push(created.id);
    return created;
  };

  it(
    'should support starting/ending halves with correct event timing',
    { timeout: 20000 },
    async () => {
      if (!apiAvailable) return;
      const firstHalfStart = Date.now();
      await patchMatch({ realTimeFirstHalfStart: firstHalfStart });

      const firstEventTimestamp = 95;
      const firstEvent = await createEvent({
        matchId,
        timestamp: firstEventTimestamp,
        playerId: homePlayerId,
        teamId: homeTeamId,
        type: 'Shot',
        subtype: 'Goal',
        position: 'CB',
        distance: '6m',
      });
      expect(firstEvent.timestamp).toBe(firstEventTimestamp);

      const firstHalfEnd = firstHalfStart + ms(FIRST_HALF_DURATION_SECONDS);
      await patchMatch({ realTimeFirstHalfEnd: firstHalfEnd });

      const secondHalfStart = firstHalfEnd + 5 * 60 * 1000;
      await patchMatch({ realTimeSecondHalfStart: secondHalfStart });

      const secondEventTimestamp = FIRST_HALF_DURATION_SECONDS + 87;
      const secondEvent = await createEvent({
        matchId,
        timestamp: secondEventTimestamp,
        playerId: awayPlayerId,
        teamId: awayTeamId,
        type: 'Shot',
        subtype: 'Goal',
        position: 'RB',
        distance: '9m',
      });
      expect(secondEvent.timestamp).toBe(secondEventTimestamp);

      const secondHalfEnd = secondHalfStart + ms(SECOND_HALF_DURATION_SECONDS);
      await patchMatch({ realTimeSecondHalfEnd: secondHalfEnd });

      const matchResponse = await fetch(`${API_URL}/api/matches/${matchId}`);
      expect(matchResponse.ok).toBe(true);
      const matchMeta = await matchResponse.json();

      expect(
        Math.floor((matchMeta.realTimeFirstHalfEnd - matchMeta.realTimeFirstHalfStart) / 1000),
      ).toBe(FIRST_HALF_DURATION_SECONDS);
      expect(
        Math.floor((matchMeta.realTimeSecondHalfEnd - matchMeta.realTimeSecondHalfStart) / 1000),
      ).toBe(SECOND_HALF_DURATION_SECONDS);

      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${matchId}`);
      expect(eventsResponse.ok).toBe(true);
      const events = await eventsResponse.json();

      const firstEventFromApi = events.find((event: any) => event.id === firstEvent.id);
      const secondEventFromApi = events.find((event: any) => event.id === secondEvent.id);
      expect(firstEventFromApi.timestamp).toBe(firstEventTimestamp);
      expect(secondEventFromApi.timestamp).toBe(secondEventTimestamp);
      expect(secondEventFromApi.timestamp).toBeGreaterThanOrEqual(FIRST_HALF_DURATION_SECONDS);
    },
  );
});

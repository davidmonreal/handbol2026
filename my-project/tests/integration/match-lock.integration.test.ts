/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

process.env.NODE_ENV = 'test'; // ensure the server in app.ts does not start listening

const prisma = new PrismaClient();

describe('Integration: match lock persistence', () => {
  let matchId: string;
  let originalHomeLocked = false;
  let originalAwayLocked = false;
  let createdMatchId: string | null = null;

  beforeAll(async () => {
    // Create an isolated match using two teams that already have players
    const homeTeam = await prisma.team.findFirst({
      where: { players: { some: {} } },
    });
    const awayTeam = await prisma.team.findFirst({
      where: { id: { not: homeTeam?.id || undefined }, players: { some: {} } },
    });

    if (!homeTeam || !awayTeam) {
      throw new Error(
        'No suitable teams with players found. Seed the DB before running this test.',
      );
    }

    const match = await prisma.match.create({
      data: {
        date: new Date(),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        isFinished: false,
        homeEventsLocked: false,
        awayEventsLocked: false,
      },
    });

    createdMatchId = match.id;
    matchId = match.id;
    originalHomeLocked = false;
    originalAwayLocked = false;
  });

  afterAll(async () => {
    if (createdMatchId) {
      await prisma.gameEvent.deleteMany({ where: { matchId: createdMatchId } });
      await prisma.match.delete({ where: { id: createdMatchId } });
    }
    await prisma.$disconnect();
  });

  it('writes lock flags through the API and persists them in the database', async () => {
    const nextHomeLocked = !originalHomeLocked;
    const nextAwayLocked = !originalAwayLocked;

    const response = await request(app)
      .patch(`/api/matches/${matchId}`)
      .send({
        homeEventsLocked: nextHomeLocked,
        awayEventsLocked: nextAwayLocked,
      })
      .expect(200);

    expect(response.body.homeEventsLocked).toBe(nextHomeLocked);
    expect(response.body.awayEventsLocked).toBe(nextAwayLocked);

    const matchInDb = await prisma.match.findUnique({ where: { id: matchId } });
    expect(matchInDb?.homeEventsLocked).toBe(nextHomeLocked);
    expect(matchInDb?.awayEventsLocked).toBe(nextAwayLocked);

    // Toggle back to original values to leave DB clean even if afterAll fails
    const revertResponse = await request(app)
      .patch(`/api/matches/${matchId}`)
      .send({
        homeEventsLocked: originalHomeLocked,
        awayEventsLocked: originalAwayLocked,
      })
      .expect(200);

    expect(revertResponse.body.homeEventsLocked).toBe(originalHomeLocked);
    expect(revertResponse.body.awayEventsLocked).toBe(originalAwayLocked);

    const matchRestored = await prisma.match.findUnique({ where: { id: matchId } });
    expect(matchRestored?.homeEventsLocked).toBe(originalHomeLocked);
    expect(matchRestored?.awayEventsLocked).toBe(originalAwayLocked);
  });
});

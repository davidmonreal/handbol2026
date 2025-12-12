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

  beforeAll(async () => {
    const match = await prisma.match.findFirst();
    if (!match) {
      throw new Error('No matches found in database. Seed the DB before running this test.');
    }
    matchId = match.id;
    originalHomeLocked = !!match.homeEventsLocked;
    originalAwayLocked = !!match.awayEventsLocked;
  });

  afterAll(async () => {
    // Restore original lock state to avoid side effects on other tests/manual data
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeEventsLocked: originalHomeLocked,
        awayEventsLocked: originalAwayLocked,
      },
    });
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

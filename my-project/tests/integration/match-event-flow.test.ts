/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

describe('Integration Tests: Match Event Flow', () => {
  let testMatchId: string;
  let testTeamId: string;
  let testPlayerId: string;
  let createdMatchId: string | null = null;

  beforeAll(async () => {
    // Build an isolated match with teams that have players to avoid locks/collisions
    const teamWithPlayers = await prisma.team.findFirst({
      where: { players: { some: {} } },
      include: { players: { include: { player: true } } },
    });
    const anotherTeam = await prisma.team.findFirst({
      where: {
        id: { not: teamWithPlayers?.id || undefined },
        players: { some: {} },
      },
    });

    if (!teamWithPlayers || !anotherTeam || !teamWithPlayers.players.length) {
      throw new Error('No suitable teams with players found. Seed the DB first.');
    }

    const match = await prisma.match.create({
      data: {
        date: new Date(),
        homeTeamId: teamWithPlayers.id,
        awayTeamId: anotherTeam.id,
        isFinished: false,
        homeEventsLocked: false,
        awayEventsLocked: false,
      },
    });

    createdMatchId = match.id;
    testMatchId = match.id;
    testTeamId = teamWithPlayers.id;
    testPlayerId = teamWithPlayers.players[0].player.id;
  });

  afterAll(async () => {
    if (createdMatchId) {
      await prisma.gameEvent.deleteMany({ where: { matchId: createdMatchId } });
      await prisma.match.delete({ where: { id: createdMatchId } });
    }
    await prisma.$disconnect();
  });

  it('should create a game event via API and retrieve it', async () => {
    // Create event via API
    const newEvent = {
      matchId: testMatchId,
      timestamp: 120,
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
    expect(createdEvent.type).toBe('Shot');
    expect(createdEvent.subtype).toBe('Goal');

    // Retrieve event via API
    const getResponse = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`);
    expect(getResponse.ok).toBe(true);
    const retrievedEvent = await getResponse.json();
    expect(retrievedEvent.id).toBe(createdEvent.id);
    expect(retrievedEvent.type).toBe('Shot');

    // Verify in database
    const dbEvent = await prisma.gameEvent.findUnique({
      where: { id: createdEvent.id },
    });
    expect(dbEvent).toBeDefined();
    expect(dbEvent?.type).toBe('Shot');

    // Cleanup
    await prisma.gameEvent.delete({ where: { id: createdEvent.id } });
  });

  it('should retrieve all events for a match via API', async () => {
    const response = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
    expect(response.ok).toBe(true);

    const events = await response.json();
    expect(Array.isArray(events)).toBe(true);

    // Verify events have correct structure
    events.forEach((event: any) => {
      expect(event.matchId).toBe(testMatchId);
      expect(event.type).toBeDefined();
      expect(['Shot', 'Turnover', 'Sanction']).toContain(event.type);
    });
  });

  it('should maintain data consistency between API and database', async () => {
    // Get events from API
    const apiResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
    const apiEvents = await apiResponse.json();

    // Get events from database
    const dbEvents = await prisma.gameEvent.findMany({
      where: { matchId: testMatchId },
      include: { player: true },
    });

    // Should have same count
    expect(apiEvents.length).toBe(dbEvents.length);

    // Verify each API event exists in database
    apiEvents.forEach((apiEvent: any) => {
      const dbEvent = dbEvents.find((e) => e.id === apiEvent.id);
      expect(dbEvent).toBeDefined();
      expect(dbEvent?.type).toBe(apiEvent.type);
      expect(dbEvent?.teamId).toBe(apiEvent.teamId);
    });
  });

  it('should calculate match score correctly from events', async () => {
    // Get all events for the match
    const response = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
    const events = await response.json();

    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: testMatchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Calculate scores from events
    const homeGoals = events.filter(
      (e: any) => e.type === 'Shot' && e.subtype === 'Goal' && e.teamId === match?.homeTeamId,
    ).length;

    const awayGoals = events.filter(
      (e: any) => e.type === 'Shot' && e.subtype === 'Goal' && e.teamId === match?.awayTeamId,
    ).length;

    // Verify scores are non-negative
    expect(homeGoals).toBeGreaterThanOrEqual(0);
    expect(awayGoals).toBeGreaterThanOrEqual(0);

    // Verify total goals match total goal events
    const totalGoalEvents = events.filter(
      (e: any) => e.type === 'Shot' && e.subtype === 'Goal',
    ).length;
    expect(homeGoals + awayGoals).toBe(totalGoalEvents);
  });

  it('should handle complete match workflow: create match -> add events -> retrieve events', async () => {
    // 1. Create a new match
    const teams = await prisma.team.findMany({ take: 2 });
    const newMatch = {
      date: new Date(),
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      isFinished: false,
    };

    const matchResponse = await fetch(`${API_URL}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    });

    expect(matchResponse.ok).toBe(true);
    const createdMatch = await matchResponse.json();

    // 2. Add events to the match
    const player = await prisma.player.findFirst();
    const event1 = {
      matchId: createdMatch.id,
      timestamp: 60,
      playerId: player?.id,
      teamId: teams[0].id,
      type: 'Shot',
      subtype: 'Goal',
      position: 'LW',
      distance: '6M',
      goalZone: 'TL',
      isCollective: false,
    };

    const eventResponse = await fetch(`${API_URL}/api/game-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event1),
    });

    expect(eventResponse.ok).toBe(true);

    // 3. Retrieve events for the match
    const getEventsResponse = await fetch(`${API_URL}/api/game-events/match/${createdMatch.id}`);
    const matchEvents = await getEventsResponse.json();

    expect(matchEvents.length).toBe(1);
    expect(matchEvents[0].type).toBe('Shot');
    expect(matchEvents[0].subtype).toBe('Goal');

    // 4. Cleanup
    await prisma.gameEvent.deleteMany({ where: { matchId: createdMatch.id } });
    await prisma.match.delete({ where: { id: createdMatch.id } });
  });

  it('should validate event data integrity across repository-service-controller layers', async () => {
    // Create event with all fields
    const completeEvent = {
      matchId: testMatchId,
      timestamp: 300,
      playerId: testPlayerId,
      teamId: testTeamId,
      type: 'Shot',
      subtype: 'Save',
      position: 'RB',
      distance: '9M',
      isCollective: true,
      goalZone: 'BR',
    };

    // POST via controller
    const response = await fetch(`${API_URL}/api/game-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeEvent),
    });

    const apiEvent = await response.json();

    // Verify via repository (direct database access)
    const dbEvent = await prisma.gameEvent.findUnique({
      where: { id: apiEvent.id },
      include: { player: true },
    });

    // All fields should match
    expect(dbEvent?.type).toBe(completeEvent.type);
    expect(dbEvent?.subtype).toBe(completeEvent.subtype);
    expect(dbEvent?.position).toBe(completeEvent.position);
    expect(dbEvent?.distance).toBe(completeEvent.distance);
    expect(dbEvent?.isCollective).toBe(completeEvent.isCollective);
    expect(dbEvent?.goalZone).toBe(completeEvent.goalZone);
    expect(dbEvent?.player).toBeDefined();
    expect(dbEvent?.player?.id).toBe(testPlayerId);

    // Cleanup
    await prisma.gameEvent.delete({ where: { id: apiEvent.id } });
  });
});

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
      name: testSeasonName(`match-event-flow-${label}`, String(now)),
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  createdSeasonIds.push(season.id);

  const club = await prisma.club.create({
    data: {
      name: testClubName(`match-event-flow-${label}`, String(now)),
    },
  });
  createdClubIds.push(club.id);

  const team = await prisma.team.create({
    data: {
      name: testTeamName(`match-event-flow-${label}`, String(now)),
      clubId: club.id,
      seasonId: season.id,
      isMyTeam: label === 'Home',
    },
  });
  createdTeamIds.push(team.id);

  const player = await prisma.player.create({
    data: {
      name: testPlayerName(`match-event-flow-${label}`, String(now)),
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

describe('Integration Tests: Match Event Flow', () => {
  let apiAvailable = false;
  let testMatchId: string;
  let testTeamId: string;
  let testPlayerId: string;
  let createdMatchId: string | null = null;

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
        realTimeFirstHalfStart: Date.now(),
      },
    });

    createdMatchId = match.id;
    testMatchId = match.id;
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

  it('should create a game event via API and retrieve it', async () => {
    if (!apiAvailable) return;
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

  it('should update and delete a game event via API', async () => {
    if (!apiAvailable) return;
    const newEvent = {
      matchId: testMatchId,
      timestamp: 240,
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
        timestamp: 255,
        subtype: 'Save',
        goalZone: 'TL',
      }),
    });
    expect(updateResponse.ok).toBe(true);

    const updatedEventRes = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`);
    expect(updatedEventRes.ok).toBe(true);
    const updatedEvent = await updatedEventRes.json();
    expect(updatedEvent.timestamp).toBe(255);
    expect(updatedEvent.subtype).toBe('Save');
    expect(updatedEvent.goalZone).toBe('TL');

    const deleteResponse = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.ok).toBe(true);

    const fetchDeleted = await fetch(`${API_URL}/api/game-events/${createdEvent.id}`);
    expect(fetchDeleted.status).toBe(404);
  });

  it('should retrieve all events for a match via API', async () => {
    if (!apiAvailable) return;
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
    if (!apiAvailable) return;
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
    if (!apiAvailable) return;
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
    if (!apiAvailable) return;
    // 1. Create a new match with dedicated teams/players
    const workflowHome = await createTeamWithPlayer('WorkflowHome');
    const workflowAway = await createTeamWithPlayer('WorkflowAway');
    const newMatch = {
      date: new Date(),
      homeTeamId: workflowHome.team.id,
      awayTeamId: workflowAway.team.id,
      isFinished: false,
    };

    const matchResponse = await fetch(`${API_URL}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    });

    expect(matchResponse.ok).toBe(true);
    const createdMatch = await matchResponse.json();

    const calibrationResponse = await fetch(`${API_URL}/api/matches/${createdMatch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realTimeFirstHalfStart: Date.now() }),
    });
    expect(calibrationResponse.ok).toBe(true);

    const event1 = {
      matchId: createdMatch.id,
      timestamp: 60,
      playerId: workflowHome.playerId,
      teamId: workflowHome.team.id,
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
    if (!apiAvailable) return;
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

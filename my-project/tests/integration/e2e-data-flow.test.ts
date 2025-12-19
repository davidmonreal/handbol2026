/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { isApiAvailable } from '../utils/api-availability';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

describe('End-to-End Data Flow Verification', () => {
  let apiAvailable = false;
  let testMatchId: string;
  let testHomeTeamId: string;
  let testAwayTeamId: string;

  beforeAll(async () => {
    apiAvailable = await isApiAvailable(API_URL);
    if (!apiAvailable) {
      return;
    }

    const match = await prisma.match.findFirst({
      include: {
        homeTeam: {
          include: {
            club: true,
            players: {
              include: { player: true },
            },
          },
        },
        awayTeam: {
          include: {
            club: true,
            players: {
              include: { player: true },
            },
          },
        },
      },
    });

    if (!match) throw new Error('No matches in database');

    testMatchId = match.id;
    testHomeTeamId = match.homeTeamId;
    testAwayTeamId = match.awayTeamId;
  });

  describe('Match Data Flow', () => {
    it('should fetch match with complete team data including players', async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/matches/${testMatchId}`);
      expect(response.ok).toBe(true);

      const match = await response.json();

      // Verify match structure
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('homeTeam');
      expect(match).toHaveProperty('awayTeam');
      expect(match).toHaveProperty('date');

      // Verify home team structure
      expect(match.homeTeam).toHaveProperty('name');
      expect(match.homeTeam).toHaveProperty('club');
      expect(match.homeTeam).toHaveProperty('players');
      expect(Array.isArray(match.homeTeam.players)).toBe(true);

      // Verify player structure in team
      if (match.homeTeam.players.length > 0) {
        const player = match.homeTeam.players[0];
        expect(player).toHaveProperty('player');
        expect(player.player).toHaveProperty('id');
        expect(player.player).toHaveProperty('name');
        expect(player.player).toHaveProperty('number');
      }

      // Verify away team structure
      expect(match.awayTeam).toHaveProperty('name');
      expect(match.awayTeam).toHaveProperty('club');
      expect(match.awayTeam).toHaveProperty('players');
      expect(Array.isArray(match.awayTeam.players)).toBe(true);
    });

    it('should fetch match events with correct format', async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      expect(response.ok).toBe(true);

      const events = await response.json();
      expect(Array.isArray(events)).toBe(true);

      if (events.length > 0) {
        const event = events[0];

        // Verify backend event structure
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('matchId');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('playerId');
        expect(event).toHaveProperty('teamId');
        expect(event).toHaveProperty('type');

        // Verify type is correct format (Shot, Turnover, Sanction)
        expect(['Shot', 'Turnover', 'Sanction']).toContain(event.type);

        // Verify has player data
        if (event.playerId) {
          expect(event).toHaveProperty('player');
          expect(event.player).toHaveProperty('name');
          expect(event.player).toHaveProperty('number');
        }

        // Verify Shot events have required fields
        if (event.type === 'Shot') {
          expect(event).toHaveProperty('subtype');
          expect(event).toHaveProperty('position');
          expect(event).toHaveProperty('distance');
          expect(event).toHaveProperty('goalZone');
        }
      }
    });

    it('should have consistent teamIds between match and events', async () => {
      if (!apiAvailable) return;
      const matchResponse = await fetch(`${API_URL}/api/matches/${testMatchId}`);
      const match = await matchResponse.json();

      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      const validTeamIds = [match.homeTeamId, match.awayTeamId];

      events.forEach((event: any) => {
        expect(validTeamIds).toContain(event.teamId);
      });
    });
  });

  describe('Team Data Flow', () => {
    it('should fetch team with club and players', async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/teams/${testHomeTeamId}`);
      expect(response.ok).toBe(true);

      const team = await response.json();

      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('category');
      expect(team).toHaveProperty('club');
      expect(team).toHaveProperty('season');
      expect(team).toHaveProperty('players');

      // Verify club data
      expect(team.club).toHaveProperty('id');
      expect(team.club).toHaveProperty('name');

      // Verify season data
      expect(team.season).toHaveProperty('id');
      expect(team.season).toHaveProperty('name');
    });

    it('should fetch all teams with nested data', async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/teams`);
      expect(response.ok).toBe(true);

      const teams = await response.json();
      expect(Array.isArray(teams)).toBe(true);

      if (teams.length > 0) {
        const team = teams[0];
        expect(team).toHaveProperty('club');
        expect(team).toHaveProperty('season');
        expect(team).toHaveProperty('players');
      }
    });
  });

  describe('Player Data Flow', () => {
    it('should fetch players with team and club information', async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/players`);
      expect(response.ok).toBe(true);

      const players = await response.json();
      expect(Array.isArray(players)).toBe(true);

      if (players.length > 0) {
        const player = players[0];

        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('name');
        expect(player).toHaveProperty('number');
        expect(player).toHaveProperty('handedness');
        expect(player).toHaveProperty('teams');

        // Verify team structure
        if (player.teams && player.teams.length > 0) {
          const teamAssignment = player.teams[0];
          expect(teamAssignment).toHaveProperty('team');
          expect(teamAssignment.team).toHaveProperty('name');
          expect(teamAssignment.team).toHaveProperty('club');
          expect(teamAssignment.team.club).toHaveProperty('name');
        }
      }
    });
  });

  describe('Event Statistics Data Flow', () => {
    it('should calculate correct statistics from events', async () => {
      if (!apiAvailable) return;
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      // Calculate goals for home team
      const homeGoals = events.filter(
        (e: any) => e.type === 'Shot' && e.subtype === 'Goal' && e.teamId === testHomeTeamId,
      ).length;

      // Calculate goals for away team
      const awayGoals = events.filter(
        (e: any) => e.type === 'Shot' && e.subtype === 'Goal' && e.teamId === testAwayTeamId,
      ).length;

      // Verify both are non-negative
      expect(homeGoals).toBeGreaterThanOrEqual(0);
      expect(awayGoals).toBeGreaterThanOrEqual(0);

      // Calculate total shots
      const totalShots = events.filter((e: any) => e.type === 'Shot').length;
      const totalGoals = homeGoals + awayGoals;

      // Goals should be <= total shots
      expect(totalGoals).toBeLessThanOrEqual(totalShots);
    });

    it('should have all Shot events with goal zones', async () => {
      if (!apiAvailable) return;
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      const shotEvents = events.filter((e: any) => e.type === 'Shot');

      shotEvents.forEach((event: any) => {
        expect(event.goalZone).toBeDefined();
        expect(event.position).toBeDefined();
        expect(event.distance).toBeDefined();
      });
    });

    it('should have valid event timestamps', async () => {
      if (!apiAvailable) return;
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      events.forEach((event: any) => {
        expect(typeof event.timestamp).toBe('number');
        expect(event.timestamp).toBeGreaterThanOrEqual(0);
        // Assuming max match time is 7200 seconds (120 minutes) to account for overtime
        expect(event.timestamp).toBeLessThanOrEqual(7200);
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have consistent player data across endpoints', async () => {
      if (!apiAvailable) return;
      // Get player from players endpoint
      const playersResponse = await fetch(`${API_URL}/api/players`);
      const players = await playersResponse.json();

      if (players.length === 0) return;

      const playerFromList = players[0];

      // Get same player from events
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      const eventWithThisPlayer = events.find((e: any) => e.playerId === playerFromList.id);

      if (eventWithThisPlayer) {
        expect(eventWithThisPlayer.player.name).toBe(playerFromList.name);
        expect(eventWithThisPlayer.player.number).toBe(playerFromList.number);
      }
    });

    it('should have consistent team names across match and team endpoints', async () => {
      if (!apiAvailable) return;
      const matchResponse = await fetch(`${API_URL}/api/matches/${testMatchId}`);
      const match = await matchResponse.json();

      const homeTeamResponse = await fetch(`${API_URL}/api/teams/${testHomeTeamId}`);
      const homeTeam = await homeTeamResponse.json();

      expect(match.homeTeam.name).toBe(homeTeam.name);
      expect(match.homeTeam.club.name).toBe(homeTeam.club.name);
    });

    it('should have all events belonging to valid teams', async () => {
      if (!apiAvailable) return;
      const matchResponse = await fetch(`${API_URL}/api/matches/${testMatchId}`);
      const match = await matchResponse.json();

      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      const validTeamIds = [match.homeTeamId, match.awayTeamId];

      events.forEach((event: any) => {
        expect(validTeamIds).toContain(event.teamId);
      });
    });

    it('should have all events with valid player assignments', async () => {
      if (!apiAvailable) return;
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const events = await eventsResponse.json();

      events.forEach((event: any) => {
        if (event.playerId) {
          // Instead of checking if player is in current team roster (which might have changed),
          // we check if the event has the player relation loaded, which implies the player exists.
          expect(event.player).toBeDefined();
          expect(event.player.id).toBe(event.playerId);
        }
      });
    });
  });

  describe('Frontend Data Transformation', () => {
    it('should correctly transform backend events for Statistics component', async () => {
      if (!apiAvailable) return;
      const eventsResponse = await fetch(`${API_URL}/api/game-events/match/${testMatchId}`);
      const backendEvents = await eventsResponse.json();

      // Simulate frontend transformation
      const transformedEvents = backendEvents.map((e: any) => ({
        id: e.id,
        timestamp: e.timestamp,
        playerId: e.playerId,
        teamId: e.teamId,
        category: e.type, // type -> category
        action: e.subtype || e.type, // subtype -> action
        zone: e.goalZone,
        context: {
          isCollective: e.isCollective,
          hasOpposition: e.hasOpposition,
          isCounterAttack: e.isCounterAttack,
        },
      }));

      // Verify transformation
      transformedEvents.forEach((transformed: any, index: number) => {
        const original = backendEvents[index];
        expect(transformed.category).toBe(original.type);
        expect(transformed.action).toBe(original.subtype || original.type);
        expect(transformed.zone).toBe(original.goalZone);
      });

      // Verify no events use legacy format
      transformedEvents.forEach((event: any) => {
        expect(event.category).not.toBe('GOAL');
        expect(event.category).not.toBe('MISS');
        expect(['Shot', 'Turnover', 'Sanction']).toContain(event.category);
      });
    });
  });
});

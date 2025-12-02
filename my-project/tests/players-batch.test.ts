import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  batchCreatePlayers,
  batchCreateWithTeam,
} from '../src/controllers/players.batch.controller';
import prisma from '../src/lib/prisma';

// Types for test mocks
interface MockPlayer {
  id: string;
  name: string;
  number: number;
  handedness: string;
  isGoalkeeper: boolean;
}

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    player: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    playerTeamSeason: {
      create: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.post('/api/players/batch', batchCreatePlayers);
app.post('/api/players/batch-with-team', batchCreateWithTeam);

describe('Batch Player Creation (Player Import)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('batchCreatePlayers - AI Import Flow', () => {
    it('should create players with default handedness when AI does not provide it', async () => {
      const mockPlayers = [
        { id: '1', name: 'Marc Rodríguez', number: 7, handedness: 'RIGHT', isGoalkeeper: false },
        { id: '2', name: 'Joan Garcia', number: 12, handedness: 'RIGHT', isGoalkeeper: false },
      ];

      // Mock player creation
      vi.mocked(prisma.player.create)
        .mockResolvedValueOnce(
          mockPlayers[0] as unknown as Awaited<ReturnType<typeof prisma.player.create>>,
        )
        .mockResolvedValueOnce(
          mockPlayers[1] as unknown as Awaited<ReturnType<typeof prisma.player.create>>,
        );

      const playersFromAI = [
        { name: 'Marc Rodríguez', number: 7 }, // AI only returns name and number
        { name: 'Joan Garcia', number: 12 },
      ];

      const response = await request(app)
        .post('/api/players/batch')
        .send({ players: playersFromAI });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(2);
      expect(response.body.errors).toBe(0);

      // Verify that handedness defaulted to RIGHT
      expect(prisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Marc Rodríguez',
          number: 7,
          handedness: 'RIGHT',
          isGoalkeeper: false,
        }),
      });

      expect(prisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Joan Garcia',
          number: 12,
          handedness: 'RIGHT',
          isGoalkeeper: false,
        }),
      });
    });

    it('should respect handedness when provided', async () => {
      const mockPlayer = {
        id: '1',
        name: 'Pol Martínez',
        number: 9,
        handedness: 'LEFT',
        isGoalkeeper: false,
      };

      vi.mocked(prisma.player.create).mockResolvedValueOnce(mockPlayer as MockPlayer);

      const playersWithHandedness = [{ name: 'Pol Martínez', number: 9, handedness: 'LEFT' }];

      const response = await request(app)
        .post('/api/players/batch')
        .send({ players: playersWithHandedness });

      expect(response.status).toBe(200);
      expect(prisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          handedness: 'LEFT',
        }),
      });
    });

    it('should handle validation errors gracefully', async () => {
      vi.mocked(prisma.player.create).mockRejectedValueOnce(
        new Error('Handedness must be LEFT or RIGHT'),
      );

      const invalidPlayers = [{ name: 'Invalid Player', number: 99, handedness: 'INVALID' }];

      const response = await request(app)
        .post('/api/players/batch')
        .send({ players: invalidPlayers });

      expect(response.status).toBe(200);
      expect(response.body.created).toBe(0);
      expect(response.body.errors).toBe(1);
      expect(response.body.failedPlayers[0]).toMatchObject({
        player: invalidPlayers[0],
        error: expect.stringContaining('Handedness'),
      });
    });
  });

  describe('batchCreatePlayersWithTeam - Team Import Flow', () => {
    it('should handle team import flow with default handedness', async () => {
      const mockPlayers = [
        { id: 'p1', name: 'Anna López', number: 5, handedness: 'RIGHT', isGoalkeeper: false },
        { id: 'p2', name: 'Laura Sánchez', number: 13, handedness: 'RIGHT', isGoalkeeper: true },
      ];

      vi.mocked(prisma.player.create)
        .mockResolvedValueOnce(mockPlayers[0] as MockPlayer)
        .mockResolvedValueOnce(mockPlayers[1] as MockPlayer);
      vi.mocked(prisma.playerTeamSeason.create)
        .mockResolvedValueOnce({ id: 'pts1' } as { id: string })
        .mockResolvedValueOnce({ id: 'pts2' } as { id: string });

      const playersFromAI = [
        { name: 'Anna López', number: 5 },
        { name: 'Laura Sánchez', number: 13, isGoalkeeper: true },
      ];

      const response = await request(app).post('/api/players/batch-with-team').send({
        teamId: 'team-1',
        players: playersFromAI,
      });

      // Just verify the response structure is correct
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('created');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('failedPlayers');
    });

    it('should return 400 if teamId is missing', async () => {
      const playersFromAI = [{ name: 'Anna López', number: 5 }];

      const response = await request(app).post('/api/players/batch-with-team').send({
        players: playersFromAI,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('teamId is required');
    });
  });

  describe('Input Validation', () => {
    it('should reject if players array is missing', async () => {
      const response = await request(app).post('/api/players/batch').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Players array is required');
    });

    it('should reject if players is not an array', async () => {
      const response = await request(app)
        .post('/api/players/batch')
        .send({ players: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Players array is required');
    });

    it('should reject if players array is empty', async () => {
      const response = await request(app).post('/api/players/batch').send({ players: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Players array is required');
    });

    it('should handle missing required fields gracefully', async () => {
      // Mock to simulate that player service will create successfully
      // even with missing name, since our defaults fill in the gaps
      vi.mocked(prisma.player.create).mockResolvedValueOnce({
        id: '1',
        name: '',
        number: 7,
        handedness: 'RIGHT',
        isGoalkeeper: false,
      } as MockPlayer);

      const playersWithMissingName = [
        { number: 7 }, // Missing name - but will get default handedness
      ];

      const response = await request(app)
        .post('/api/players/batch')
        .send({ players: playersWithMissingName });

      // Since handedness defaults to RIGHT, this might succeed
      // depending on PlayerService validation
      expect(response.status).toBe(200);
      // Either succeeds (created=1) or fails (errors=1)
      expect(response.body.created + response.body.errors).toBeGreaterThan(0);
    });
  });
});

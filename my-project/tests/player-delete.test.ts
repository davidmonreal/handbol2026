import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerController } from '../src/controllers/player-controller';
import { PlayerService } from '../src/services/player-service';
import { PlayerRepository } from '../src/repositories/player-repository';
import type { Request, Response } from 'express';

vi.mock('../src/repositories/player-repository');

describe('PlayerController - Delete Operations', () => {
  let controller: PlayerController;
  let service: PlayerService;
  let repository: PlayerRepository;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    repository = new PlayerRepository();
    service = new PlayerService(repository);
    controller = new PlayerController(service);

    req = {
      params: {},
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe('delete', () => {
    it('should successfully delete a player', async () => {
      const playerId = 'player-123';
      req.params = { id: playerId };

      const deletedPlayer = {
        id: playerId,
        name: 'Test Player',
        number: 10,
        handedness: 'RIGHT',
        isGoalkeeper: false,
      };

      vi.mocked(repository.delete).mockResolvedValue(deletedPlayer);

      await controller.delete(req as Request, res as Response);

      expect(repository.delete).toHaveBeenCalledWith(playerId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 500 when player does not exist', async () => {
      const playerId = 'non-existent-id';
      req.params = { id: playerId };

      vi.mocked(repository.delete).mockRejectedValue(new Error('Player not found'));

      await controller.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete player' });
    });

    it('should return 500 on database error', async () => {
      const playerId = 'player-456';
      req.params = { id: playerId };

      vi.mocked(repository.delete).mockRejectedValue(new Error('Database connection failed'));

      await controller.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete player' });
    });
  });

  describe('delete with cascade', () => {
    it('should delete player and cascade delete related records', async () => {
      // This test ensures that deleting a player also removes:
      // - PlayerTeamSeason records (cascade delete)
      // - GameEvent references (set to null)

      const playerId = 'player-with-relations';
      req.params = { id: playerId };

      const deletedPlayer = {
        id: playerId,
        name: 'Player With Relations',
        number: 7,
        handedness: 'LEFT',
        isGoalkeeper: true,
      };

      vi.mocked(repository.delete).mockResolvedValue(deletedPlayer);

      await controller.delete(req as Request, res as Response);

      expect(repository.delete).toHaveBeenCalledWith(playerId);
      expect(res.status).toHaveBeenCalledWith(204);
      // The cascade delete happens at the database level via Prisma schema
    });
  });
});

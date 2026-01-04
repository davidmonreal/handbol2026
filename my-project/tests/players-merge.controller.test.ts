import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PLAYER_POSITION } from '../src/types/player-position';

const { mockFindById, mockTransaction } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('../src/repositories/player-repository', () => ({
  PlayerRepository: vi.fn().mockImplementation(() => ({
    findById: mockFindById,
  })),
}));

vi.mock('../src/lib/prisma', () => ({
  default: {
    $transaction: mockTransaction,
  },
}));

import { mergePlayer } from '../src/controllers/players.merge.controller';

describe('mergePlayer controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    vi.clearAllMocks();
  });

  it('marks goalkeeper when old team assignments include goalkeeper position', async () => {
    req.body = {
      oldPlayerId: 'old-1',
      newPlayerData: { name: 'test-New GK', handedness: 'RIGHT' },
    };

    mockFindById
      .mockResolvedValueOnce({ id: 'old-1' })
      .mockResolvedValueOnce({ id: 'new-1', name: 'test-New GK' });

    const tx = {
      player: {
        create: vi.fn().mockResolvedValue({ id: 'new-1' }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      gameEvent: {
        updateMany: vi.fn(),
      },
      playerTeamSeason: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ teamId: 't1', number: 1, position: PLAYER_POSITION.GOALKEEPER }]),
        create: vi.fn(),
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    mockTransaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );

    await mergePlayer(req as Request, res as Response);

    expect(tx.player.update).toHaveBeenCalledWith({
      where: { id: 'new-1' },
      data: { isGoalkeeper: true },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, player: { id: 'new-1', name: 'test-New GK' } }),
    );
  });

  it('uses provided goalkeeper position when adding a new team', async () => {
    req.body = {
      oldPlayerId: 'old-2',
      newPlayerData: {
        name: 'test-New Player',
        number: 12,
        handedness: 'LEFT',
        position: PLAYER_POSITION.GOALKEEPER,
      },
      teamId: 'team-1',
    };

    mockFindById
      .mockResolvedValueOnce({ id: 'old-2' })
      .mockResolvedValueOnce({ id: 'new-2', name: 'test-New Player' });

    const tx = {
      player: {
        create: vi.fn().mockResolvedValue({ id: 'new-2' }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      gameEvent: {
        updateMany: vi.fn(),
      },
      playerTeamSeason: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn(),
      },
    };

    mockTransaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );

    await mergePlayer(req as Request, res as Response);

    expect(tx.playerTeamSeason.create).toHaveBeenCalledWith({
      data: {
        playerId: 'new-2',
        teamId: 'team-1',
        number: 12,
        position: PLAYER_POSITION.GOALKEEPER,
      },
    });
    expect(tx.player.update).toHaveBeenCalledWith({
      where: { id: 'new-2' },
      data: { isGoalkeeper: true },
    });
  });
});

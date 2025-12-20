import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEventRepository } from '../src/repositories/game-event-repository';
import prisma from '../src/lib/prisma';
import { GameEvent } from '@prisma/client';

vi.mock('../src/lib/prisma', () => ({
  default: {
    gameEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('GameEventRepository', () => {
  let repository: GameEventRepository;

  beforeEach(() => {
    repository = new GameEventRepository();
    vi.clearAllMocks();
  });

  it('findAll uses select on related entities', async () => {
    const mockEvents: GameEvent[] = [{ id: 'e1' } as GameEvent];
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue(mockEvents);

    const result = await repository.findAll({ teamId: 't1', playerId: 'p1' });

    expect(prisma.gameEvent.findMany).toHaveBeenCalledWith({
      where: { teamId: 't1', playerId: 'p1' },
      include: {
        player: {
          select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
        },
        match: {
          select: {
            id: true,
            date: true,
            homeTeam: {
              select: {
                id: true,
                name: true,
                category: true,
                club: { select: { id: true, name: true } },
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                category: true,
                club: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
    expect(result).toEqual(mockEvents);
  });

  it('findByMatchId selects minimal related data', async () => {
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue([]);

    await repository.findByMatchId('m1');

    expect(prisma.gameEvent.findMany).toHaveBeenCalledWith({
      where: { matchId: 'm1' },
      include: {
        player: {
          select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
        },
        activeGoalkeeper: {
          select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  });

  it('findById selects minimal match and player', async () => {
    const mockEvent = { id: 'e1' } as GameEvent;
    vi.mocked(prisma.gameEvent.findUnique).mockResolvedValue(mockEvent);

    const result = await repository.findById('e1');

    expect(prisma.gameEvent.findUnique).toHaveBeenCalledWith({
      where: { id: 'e1' },
      include: {
        player: {
          select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
        },
        match: {
          select: {
            id: true,
            date: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        },
      },
    });
    expect(result).toEqual(mockEvent);
  });
});

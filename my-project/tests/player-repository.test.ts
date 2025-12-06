import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerRepository } from '../src/repositories/player-repository';
import prisma from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
  default: {
    player: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('PlayerRepository', () => {
  let repository: PlayerRepository;

  beforeEach(() => {
    repository = new PlayerRepository();
    vi.clearAllMocks();
  });

  it('findAll returns all players ordered by name (optimized with select)', async () => {
    const mockPlayers = [
      { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' as const, isGoalkeeper: false },
      { id: '2', name: 'Bob', number: 7, handedness: 'LEFT' as const, isGoalkeeper: false },
    ];
    vi.mocked(prisma.player.findMany).mockResolvedValue(mockPlayers);

    const result = await repository.findAll();

    // Optimized query: uses select instead of include for minimal data transfer
    expect(prisma.player.findMany).toHaveBeenCalledWith({
      include: {
        teams: {
          select: {
            team: {
              select: {
                name: true,
                category: true,
                club: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(mockPlayers);
  });

  it('findById returns a player by id', async () => {
    const mockPlayer = {
      id: '1',
      name: 'Player 1',
      number: 10,
      handedness: 'RIGHT' as const,
      isGoalkeeper: false,
    };
    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);

    const result = await repository.findById('1');

    expect(prisma.player.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: {
        teams: {
          include: {
            team: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual(mockPlayer);
  });

  it('create creates a new player', async () => {
    const newPlayer = {
      name: 'New Player',
      number: 11,
      handedness: 'LEFT' as const,
      isGoalkeeper: false,
    };
    const createdPlayer = { id: '2', ...newPlayer };
    vi.mocked(prisma.player.create).mockResolvedValue(createdPlayer);

    const result = await repository.create(newPlayer);

    expect(prisma.player.create).toHaveBeenCalledWith({
      data: newPlayer,
    });
    expect(result).toEqual(createdPlayer);
  });

  it('update modifies an existing player', async () => {
    const updateData = { name: 'Alice Updated' };
    const updatedPlayer = {
      id: '1',
      name: 'Alice Updated',
      number: 10,
      handedness: 'RIGHT' as const,
      isGoalkeeper: false,
    };
    vi.mocked(prisma.player.update).mockResolvedValue(updatedPlayer);

    const result = await repository.update('1', updateData);

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    });
    expect(result).toEqual(updatedPlayer);
  });

  it('delete removes a player', async () => {
    const deletedPlayer = {
      id: '1',
      name: 'Alice',
      number: 10,
      handedness: 'RIGHT' as const,
      isGoalkeeper: false,
    };
    vi.mocked(prisma.player.delete).mockResolvedValue(deletedPlayer);

    const result = await repository.delete('1');

    expect(prisma.player.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(deletedPlayer);
  });
});

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
      count: vi.fn(),
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
      select: {
        id: true,
        name: true,
        number: true,
        handedness: true,
        isGoalkeeper: true,
        teams: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                category: true,
                club: {
                  select: { id: true, name: true },
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

  describe('findAllPaginated', () => {
    it('returns paginated players with skip and take', async () => {
      const mockPlayers = [
        { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' as const, isGoalkeeper: false },
      ];
      vi.mocked(prisma.player.findMany).mockResolvedValue(mockPlayers);

      const result = await repository.findAllPaginated({ skip: 0, take: 20 });

      expect(prisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' },
        }),
      );
      expect(result).toEqual(mockPlayers);
    });

    it('filters by search term on name', async () => {
      const mockPlayers = [
        { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' as const, isGoalkeeper: false },
      ];
      vi.mocked(prisma.player.findMany).mockResolvedValue(mockPlayers);

      await repository.findAllPaginated({ skip: 0, take: 20, search: 'Ali' });

      expect(prisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Ali' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('count', () => {
    it('returns total count of players', async () => {
      vi.mocked(prisma.player.count).mockResolvedValue(50);

      const result = await repository.count({});

      expect(prisma.player.count).toHaveBeenCalled();
      expect(result).toBe(50);
    });

    it('returns filtered count when search provided', async () => {
      vi.mocked(prisma.player.count).mockResolvedValue(5);

      const result = await repository.count({ search: 'Ali' });

      expect(prisma.player.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
      expect(result).toBe(5);
    });
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
      select: {
        id: true,
        name: true,
        number: true,
        handedness: true,
        isGoalkeeper: true,
        teams: {
          select: {
            team: {
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

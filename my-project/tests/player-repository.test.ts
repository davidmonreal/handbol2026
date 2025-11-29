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

    it('findAll returns all players ordered by name', async () => {
        const mockPlayers = [
            { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' },
            { id: '2', name: 'Bob', number: 7, handedness: 'LEFT' },
        ];
        (prisma.player.findMany as any).mockResolvedValue(mockPlayers);

        const result = await repository.findAll();

        expect(prisma.player.findMany).toHaveBeenCalledWith({
            orderBy: { name: 'asc' },
        });
        expect(result).toEqual(mockPlayers);
    });

    it('findById returns a player by id', async () => {
        const mockPlayer = { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' };
        (prisma.player.findUnique as any).mockResolvedValue(mockPlayer);

        const result = await repository.findById('1');

        expect(prisma.player.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(mockPlayer);
    });

    it('create creates a new player', async () => {
        const newPlayerData = { name: 'Charlie', number: 15, handedness: 'RIGHT' };
        const createdPlayer = { id: '3', ...newPlayerData };
        (prisma.player.create as any).mockResolvedValue(createdPlayer);

        const result = await repository.create(newPlayerData);

        expect(prisma.player.create).toHaveBeenCalledWith({
            data: newPlayerData,
        });
        expect(result).toEqual(createdPlayer);
    });

    it('update modifies an existing player', async () => {
        const updateData = { name: 'Alice Updated' };
        const updatedPlayer = { id: '1', name: 'Alice Updated', number: 10, handedness: 'RIGHT' };
        (prisma.player.update as any).mockResolvedValue(updatedPlayer);

        const result = await repository.update('1', updateData);

        expect(prisma.player.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: updateData,
        });
        expect(result).toEqual(updatedPlayer);
    });

    it('delete removes a player', async () => {
        const deletedPlayer = { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' };
        (prisma.player.delete as any).mockResolvedValue(deletedPlayer);

        const result = await repository.delete('1');

        expect(prisma.player.delete).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(deletedPlayer);
    });
});

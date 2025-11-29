import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeasonRepository } from '../src/repositories/season-repository';
import prisma from '../src/lib/prisma';

// Mock prisma
vi.mock('../src/lib/prisma', () => ({
    default: {
        season: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('SeasonRepository', () => {
    let repository: SeasonRepository;

    beforeEach(() => {
        repository = new SeasonRepository();
        vi.clearAllMocks();
    });

    it('findAll returns all seasons ordered by startDate desc', async () => {
        const mockSeasons = [
            { id: '1', name: '2024-2025', startDate: new Date(), endDate: new Date() },
            { id: '2', name: '2023-2024', startDate: new Date(), endDate: new Date() },
        ];
        (prisma.season.findMany as any).mockResolvedValue(mockSeasons);

        const result = await repository.findAll();

        expect(prisma.season.findMany).toHaveBeenCalledWith({
            orderBy: { startDate: 'desc' },
        });
        expect(result).toEqual(mockSeasons);
    });

    it('findById returns a season by id', async () => {
        const mockSeason = { id: '1', name: '2024-2025', startDate: new Date(), endDate: new Date() };
        (prisma.season.findUnique as any).mockResolvedValue(mockSeason);

        const result = await repository.findById('1');

        expect(prisma.season.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(mockSeason);
    });

    it('create creates a new season', async () => {
        const newSeasonData = {
            name: '2025-2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30')
        };
        const createdSeason = { id: '3', ...newSeasonData };
        (prisma.season.create as any).mockResolvedValue(createdSeason);

        const result = await repository.create(newSeasonData);

        expect(prisma.season.create).toHaveBeenCalledWith({
            data: newSeasonData,
        });
        expect(result).toEqual(createdSeason);
    });

    it('update modifies an existing season', async () => {
        const updateData = { name: 'Updated Name' };
        const updatedSeason = { id: '1', name: 'Updated Name', startDate: new Date(), endDate: new Date() };
        (prisma.season.update as any).mockResolvedValue(updatedSeason);

        const result = await repository.update('1', updateData);

        expect(prisma.season.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: updateData,
        });
        expect(result).toEqual(updatedSeason);
    });

    it('delete removes a season', async () => {
        const deletedSeason = { id: '1', name: 'Deleted', startDate: new Date(), endDate: new Date() };
        (prisma.season.delete as any).mockResolvedValue(deletedSeason);

        const result = await repository.delete('1');

        expect(prisma.season.delete).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(deletedSeason);
    });
});

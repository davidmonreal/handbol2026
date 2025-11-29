import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchRepository } from '../src/repositories/match-repository';
import prisma from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
    default: {
        match: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('MatchRepository', () => {
    let repository: MatchRepository;

    beforeEach(() => {
        repository = new MatchRepository();
        vi.clearAllMocks();
    });

    it('findAll returns all matches ordered by date desc', async () => {
        const mockMatches = [
            { id: '1', date: new Date(), homeTeamId: 'h1', awayTeamId: 'a1' }
        ];
        vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches);

        const result = await repository.findAll();

        expect(prisma.match.findMany).toHaveBeenCalledWith({
            include: { homeTeam: true, awayTeam: true },
            orderBy: { date: 'desc' },
        });
        expect(result).toEqual(mockMatches);
    });

    it('findById returns a match by id', async () => {
        const mockMatch = { id: '1', date: new Date(), homeTeamId: 'h1', awayTeamId: 'a1' };
        vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch);

        const result = await repository.findById('1');

        expect(prisma.match.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
            include: { homeTeam: true, awayTeam: true },
        });
        expect(result).toEqual(mockMatch);
    });

    it('create creates a new match', async () => {
        const newMatchData = { date: new Date(), homeTeamId: 'h1', awayTeamId: 'a1' };
        const createdMatch = { id: '1', ...newMatchData };
        vi.mocked(prisma.match.create).mockResolvedValue(createdMatch);

        const result = await repository.create(newMatchData);

        expect(prisma.match.create).toHaveBeenCalledWith({
            data: newMatchData,
            include: { homeTeam: true, awayTeam: true },
        });
        expect(result).toEqual(createdMatch);
    });

    it('update updates an existing match', async () => {
        const updateData = { isFinished: true };
        const updatedMatch = { id: '1', date: new Date(), homeTeamId: 'h1', awayTeamId: 'a1', isFinished: true };
        vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);

        const result = await repository.update('1', updateData);

        expect(prisma.match.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: updateData,
            include: { homeTeam: true, awayTeam: true },
        });
        expect(result).toEqual(updatedMatch);
    });

    it('delete removes a match', async () => {
        const deletedMatch = { id: '1', date: new Date(), homeTeamId: 'h1', awayTeamId: 'a1' };
        vi.mocked(prisma.match.delete).mockResolvedValue(deletedMatch);

        const result = await repository.delete('1');

        expect(prisma.match.delete).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(deletedMatch);
    });
});

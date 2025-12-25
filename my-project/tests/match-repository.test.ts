/* eslint-disable @typescript-eslint/no-explicit-any */
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
      {
        id: '1',
        date: new Date(),
        homeTeamId: 'h1',
        awayTeamId: 'a1',
        isFinished: false,
        homeScore: 0,
        awayScore: 0,
      },
      {
        id: '2',
        date: new Date(),
        homeTeamId: 'h2',
        awayTeamId: 'a2',
        isFinished: false,
        homeScore: 0,
        awayScore: 0,
      },
    ];
    (prisma.match.findMany as any).mockResolvedValue(mockMatches);

    const result = await repository.findAll();

    // Events removed for performance - scores come from DB columns
    expect(prisma.match.findMany).toHaveBeenCalledWith({
      select: expect.objectContaining({
        id: true,
        homeTeam: expect.anything(),
        awayTeam: expect.anything(),
      }),
      orderBy: { date: 'desc' },
    });
    expect(result).toEqual(mockMatches);
  });

  it('findById returns a match by id', async () => {
    const mockMatch = { id: '1', homeTeam: { name: 'test-Home' }, awayTeam: { name: 'test-Away' } };
    (prisma.match.findUnique as any).mockResolvedValue(mockMatch);

    const result = await repository.findById('1');

    expect(prisma.match.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      select: expect.objectContaining({
        id: true,
        homeTeam: expect.anything(),
        awayTeam: expect.anything(),
      }),
    });
    expect(result).toEqual(mockMatch);
  });

  it('create creates a new match', async () => {
    const newMatchData = {
      date: new Date(),
      homeTeamId: 'h1',
      awayTeamId: 'a1',
    };
    const createdMatch = { id: '1', ...newMatchData };
    (prisma.match.create as any).mockResolvedValue(createdMatch);

    const result = await repository.create(newMatchData);

    expect(prisma.match.create).toHaveBeenCalledWith({
      data: newMatchData,
      select: expect.anything(),
    });
    expect(result).toEqual(createdMatch);
  });

  it('update updates an existing match', async () => {
    const updateData = { isFinished: true };
    const updatedMatch = { id: '1', ...updateData };
    (prisma.match.update as any).mockResolvedValue(updatedMatch);

    const result = await repository.update('1', updateData);

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
      select: expect.anything(),
    });
    expect(result).toEqual(updatedMatch);
  });

  it('delete removes a match', async () => {
    const mockMatch = {
      id: '1',
      date: new Date(),
      homeTeamId: 'h1',
      awayTeamId: 'a1',
      isFinished: false,
    };
    (prisma.match.delete as any).mockResolvedValue(mockMatch);

    const result = await repository.delete('1');

    expect(prisma.match.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(mockMatch);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchService } from '../src/services/match-service';
import { MatchRepository } from '../src/repositories/match-repository';
import prisma from '../src/lib/prisma';

vi.mock('../src/repositories/match-repository');
vi.mock('../src/lib/prisma', () => ({
  default: {
    team: {
      findUnique: vi.fn(),
    },
  },
}));

describe('MatchService', () => {
  let service: MatchService;
  let repository: MatchRepository;

  beforeEach(() => {
    repository = new MatchRepository();
    service = new MatchService(repository);
    vi.clearAllMocks();
  });

  it('create validates date format', async () => {
    const invalidData = { date: 'invalid', homeTeamId: 'h1', awayTeamId: 'a1' };
    await expect(service.create(invalidData)).rejects.toThrow('Invalid date format');
  });

  it('create validates teams are different', async () => {
    const sameTeams = { date: '2024-10-10', homeTeamId: 't1', awayTeamId: 't1' };
    await expect(service.create(sameTeams)).rejects.toThrow(
      'Home and Away teams must be different',
    );
  });

  it('create validates home team exists', async () => {
    const data = { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' };
    vi.mocked(prisma.team.findUnique).mockResolvedValueOnce(null); // Home team not found

    await expect(service.create(data)).rejects.toThrow('Home team not found');
  });

  it('create validates away team exists', async () => {
    const data = { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' };
    vi.mocked(prisma.team.findUnique)
      .mockResolvedValueOnce({ id: 'h1' }) // Home team found
      .mockResolvedValueOnce(null); // Away team not found

    await expect(service.create(data)).rejects.toThrow('Away team not found');
  });

  it('create calls repository with valid data', async () => {
    const data = { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' };
    const createdMatch = { id: '1', ...data, date: new Date(data.date) };

    vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: 'team' } as unknown as any);
    vi.mocked(repository.create).mockResolvedValue(createdMatch);

    const result = await service.create(data);

    expect(repository.create).toHaveBeenCalledWith({
      ...data,
      date: new Date(data.date),
    });
    expect(result).toEqual(createdMatch);
  });
});

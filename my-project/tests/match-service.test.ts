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

  describe('getAll', () => {
    it('returns matches with homeScore and awayScore from DB columns', async () => {
      const mockMatches = [
        {
          id: 'm1',
          date: new Date('2024-10-10'),
          homeTeamId: 'h1',
          awayTeamId: 'a1',
          homeScore: 25,
          awayScore: 22,
          isFinished: true,
          homeTeam: { id: 'h1', name: 'test-Home Team', club: { name: 'test-Club A' } },
          awayTeam: { id: 'a1', name: 'test-Away Team', club: { name: 'test-Club B' } },
        },
        {
          id: 'm2',
          date: new Date('2024-10-11'),
          homeTeamId: 'h2',
          awayTeamId: 'a2',
          homeScore: 30,
          awayScore: 28,
          isFinished: false,
          homeTeam: { id: 'h2', name: 'test-Home Team 2', club: { name: 'test-Club C' } },
          awayTeam: { id: 'a2', name: 'test-Away Team 2', club: { name: 'test-Club D' } },
        },
      ];

      vi.mocked(repository.findAll).mockResolvedValue(mockMatches as any);

      const result = await service.getAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      // Verify scores come directly from DB columns
      expect(result[0].homeScore).toBe(25);
      expect(result[0].awayScore).toBe(22);
      expect(result[1].homeScore).toBe(30);
      expect(result[1].awayScore).toBe(28);

      // Verify team info is included
      expect(result[0].homeTeam.name).toBe('test-Home Team');
      expect(result[0].awayTeam.club.name).toBe('test-Club B');
    });

    it('returns empty array when no matches exist', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('fills missing team player positions from team lookup', async () => {
      const match = {
        id: 'm1',
        homeTeam: {
          id: 'home-1',
          players: [{ position: null, player: { id: 'p1' } }],
        },
        awayTeam: {
          id: 'away-1',
          players: [{ position: null, player: { id: 'p2' } }],
        },
      };

      vi.mocked(repository.findById).mockResolvedValue(match as any);
      vi.mocked(prisma.team.findUnique)
        .mockResolvedValueOnce({
          players: [{ position: 2, player: { id: 'p1' } }],
        } as any)
        .mockResolvedValueOnce({
          players: [{ position: 6, player: { id: 'p2' } }],
        } as any);

      const result = await service.findById('m1');

      expect(prisma.team.findUnique).toHaveBeenCalledTimes(2);
      expect(result?.homeTeam.players[0].position).toBe(2);
      expect(result?.awayTeam.players[0].position).toBe(6);
    });

    it('skips lookup when positions are already present', async () => {
      const match = {
        id: 'm1',
        homeTeam: {
          id: 'home-1',
          players: [{ position: 3, player: { id: 'p1' } }],
        },
        awayTeam: {
          id: 'away-1',
          players: [{ position: 7, player: { id: 'p2' } }],
        },
      };

      vi.mocked(repository.findById).mockResolvedValue(match as any);

      const result = await service.findById('m1');

      expect(prisma.team.findUnique).not.toHaveBeenCalled();
      expect(result?.homeTeam.players[0].position).toBe(3);
      expect(result?.awayTeam.players[0].position).toBe(7);
    });
  });
});

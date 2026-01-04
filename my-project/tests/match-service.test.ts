/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchService } from '../src/services/match-service';
import { MatchRepository } from '../src/repositories/match-repository';
import { TeamRepository } from '../src/repositories/team-repository';
import { GameEventRepository } from '../src/repositories/game-event-repository';
import { PlayerRepository } from '../src/repositories/player-repository';

vi.mock('../src/repositories/match-repository');
vi.mock('../src/repositories/team-repository');
vi.mock('../src/repositories/game-event-repository');
vi.mock('../src/repositories/player-repository');

describe('MatchService', () => {
  let service: MatchService;
  let matchRepository: MatchRepository;
  let teamRepository: TeamRepository;
  let gameEventRepository: GameEventRepository;
  let playerRepository: PlayerRepository;

  beforeEach(() => {
    matchRepository = new MatchRepository();
    teamRepository = new TeamRepository();
    gameEventRepository = new GameEventRepository();
    playerRepository = new PlayerRepository();
    service = new MatchService(
      matchRepository,
      teamRepository,
      gameEventRepository,
      playerRepository,
    );
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
    vi.mocked(teamRepository.exists).mockResolvedValueOnce(false); // Home team not found

    await expect(service.create(data)).rejects.toThrow('Home team not found');
  });

  it('create validates away team exists', async () => {
    const data = { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' };
    vi.mocked(teamRepository.exists)
      .mockResolvedValueOnce(true) // Home team found
      .mockResolvedValueOnce(false); // Away team not found

    await expect(service.create(data)).rejects.toThrow('Away team not found');
  });

  it('create calls repository with valid data', async () => {
    const data = { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' };
    const createdMatch = { id: '1', ...data, date: new Date(data.date) };

    vi.mocked(teamRepository.exists).mockResolvedValue(true);
    vi.mocked(matchRepository.create).mockResolvedValue(createdMatch);

    const result = await service.create(data);

    expect(matchRepository.create).toHaveBeenCalledWith({
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

      vi.mocked(matchRepository.findAll).mockResolvedValue(mockMatches as any);

      const result = await service.getAll();

      expect(matchRepository.findAll).toHaveBeenCalled();
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
      vi.mocked(matchRepository.findAll).mockResolvedValue([]);

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

      vi.mocked(matchRepository.findById).mockResolvedValue(match as any);
      vi.mocked(teamRepository.findTeamWithPlayerPositions)
        .mockResolvedValueOnce({
          players: [{ position: 2, player: { id: 'p1' } }],
        } as any)
        .mockResolvedValueOnce({
          players: [{ position: 6, player: { id: 'p2' } }],
        } as any);

      const result = await service.findById('m1');

      expect(teamRepository.findTeamWithPlayerPositions).toHaveBeenCalledTimes(2);
      expect((result as any)?.homeTeam.players[0].position).toBe(2);
      expect((result as any)?.awayTeam.players[0].position).toBe(6);
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

      vi.mocked(matchRepository.findById).mockResolvedValue(match as any);

      const result = await service.findById('m1');

      expect(teamRepository.findTeamWithPlayerPositions).not.toHaveBeenCalled();
      expect((result as any)?.homeTeam.players[0].position).toBe(3);
      expect((result as any)?.awayTeam.players[0].position).toBe(7);
    });
  });

  describe('delete', () => {
    it('deletes game events before match', async () => {
      vi.mocked(gameEventRepository.deleteByMatchId).mockResolvedValue(5);
      vi.mocked(matchRepository.delete).mockResolvedValue({ id: 'm1' } as any);

      await service.delete('m1');

      expect(gameEventRepository.deleteByMatchId).toHaveBeenCalledWith('m1');
      expect(matchRepository.delete).toHaveBeenCalledWith('m1');
    });
  });

  describe('team migration', () => {
    it('previews migration with event and player counts', async () => {
      vi.mocked(matchRepository.findById).mockResolvedValue({
        id: 'm1',
        isFinished: true,
        homeTeamId: 'home-1',
        awayTeamId: 'away-1',
        homeTeam: { id: 'home-1', name: 'test-Home' },
        awayTeam: { id: 'away-1', name: 'test-Away' },
      } as any);
      vi.mocked(teamRepository.findById).mockResolvedValue({
        id: 'away-2',
        name: 'test-Away B',
      } as any);
      vi.mocked(gameEventRepository.countByMatchAndTeam).mockResolvedValue(3);
      vi.mocked(gameEventRepository.findPlayerIdsByMatchAndTeam).mockResolvedValue(['p1', 'p2']);
      vi.mocked(playerRepository.findByIds).mockResolvedValue([
        { id: 'p1', name: 'test-Player 1' },
      ] as any);
      vi.mocked(gameEventRepository.countOpponentGoalkeeperEvents).mockResolvedValue(2);

      const preview = await service.previewTeamMigration('m1', { awayTeamId: 'away-2' });

      expect(preview.changes).toHaveLength(1);
      expect(preview.changes[0].eventCount).toBe(3);
      expect(preview.changes[0].players).toEqual([{ id: 'p1', name: 'test-Player 1' }]);
      expect(preview.changes[0].requiresGoalkeeper).toBe(true);
    });

    it('applies migration with goalkeeper update', async () => {
      vi.mocked(matchRepository.findById).mockResolvedValue({
        id: 'm1',
        isFinished: true,
        homeTeamId: 'home-1',
        awayTeamId: 'away-1',
      } as any);
      vi.mocked(teamRepository.findById).mockResolvedValue({
        id: 'away-2',
        name: 'test-Away B',
      } as any);
      vi.mocked(gameEventRepository.countOpponentGoalkeeperEvents).mockResolvedValue(1);
      vi.mocked(playerRepository.findById).mockResolvedValue({ id: 'gk-1' } as any);
      vi.mocked(gameEventRepository.findPlayerIdsByMatchAndTeam).mockResolvedValue(['p1']);
      vi.mocked(teamRepository.findPlayerNumbers)
        .mockResolvedValueOnce([
          { playerId: 'p1', number: 7 },
          { playerId: 'gk-1', number: 1 },
        ])
        .mockResolvedValueOnce([]);
      vi.mocked(teamRepository.isNumberAssigned).mockResolvedValue(false);
      vi.mocked(matchRepository.applyTeamMigration).mockResolvedValue({ id: 'm1' } as any);

      const result = await service.applyTeamMigration('m1', {
        awayTeamId: 'away-2',
        awayGoalkeeperId: 'gk-1',
      });

      expect(matchRepository.applyTeamMigration).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: 'm1',
          teamEventUpdates: [{ fromTeamId: 'away-1', toTeamId: 'away-2' }],
          opponentGoalkeeperUpdates: [{ attackingTeamId: 'home-1', goalkeeperId: 'gk-1' }],
          playerAssignments: [
            {
              teamId: 'away-2',
              players: [
                { playerId: 'p1', number: 7 },
                { playerId: 'gk-1', number: 1 },
              ],
            },
          ],
        }),
      );
      expect(result).toEqual({ id: 'm1' });
    });
  });
});

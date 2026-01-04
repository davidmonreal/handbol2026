/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '../src/services/team-service';
import { TeamRepository } from '../src/repositories/team-repository';
import { ClubRepository } from '../src/repositories/club-repository';
import { SeasonRepository } from '../src/repositories/season-repository';
import { PlayerRepository } from '../src/repositories/player-repository';
import { PLAYER_POSITION } from '../src/types/player-position';
import { Handedness } from '@prisma/client';

vi.mock('../src/repositories/team-repository');
vi.mock('../src/repositories/club-repository');
vi.mock('../src/repositories/season-repository');
vi.mock('../src/repositories/player-repository');

describe('TeamService', () => {
  let service: TeamService;
  let teamRepository: TeamRepository;
  let clubRepository: ClubRepository;
  let seasonRepository: SeasonRepository;
  let playerRepository: PlayerRepository;

  beforeEach(() => {
    teamRepository = new TeamRepository();
    clubRepository = new ClubRepository();
    seasonRepository = new SeasonRepository();
    playerRepository = new PlayerRepository();
    service = new TeamService(teamRepository, clubRepository, seasonRepository, playerRepository);
    vi.clearAllMocks();
  });

  it('getAll calls repository.findAll', async () => {
    const mockTeams = [
      {
        id: '1',
        name: 'test-Cadet A',
        category: 'Cadet M',
        isMyTeam: false,
        clubId: 'c1',
        seasonId: 's1',
      },
    ];
    vi.mocked(teamRepository.findAll).mockResolvedValue(mockTeams);

    const result = await service.getAll();

    expect(teamRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockTeams);
  });

  it('create validates season exists when seasonId provided', async () => {
    const data = {
      name: 'test-New Team',
      category: 'Senior M',
      clubId: 'c1',
      seasonId: 's1',
      isMyTeam: true,
    };
    const createdTeam = { id: '1', ...data };

    vi.mocked(seasonRepository.findById).mockResolvedValue({ id: 's1' } as any);
    vi.mocked(teamRepository.create).mockResolvedValue(createdTeam as any);

    const result = await service.create(data);

    expect(seasonRepository.findById).toHaveBeenCalledWith('s1');
    expect(teamRepository.create).toHaveBeenCalled();
    expect(result).toEqual(createdTeam);
  });

  it('create throws error if season not found when seasonId provided', async () => {
    const newTeamData = {
      name: 'test-Test',
      category: 'Senior M',
      clubId: 'c1',
      seasonId: 'invalid',
    };
    vi.mocked(seasonRepository.findById).mockResolvedValue(null);

    await expect(service.create(newTeamData)).rejects.toThrow('Season not found');
    expect(teamRepository.create).not.toHaveBeenCalled();
  });

  it('assignPlayer validates player exists', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.CENTRAL,
    };

    vi.mocked(playerRepository.findById).mockResolvedValue(mockPlayer);
    vi.mocked(teamRepository.isPlayerAssigned).mockResolvedValue(false);
    vi.mocked(teamRepository.hasGoalkeeperAssignment).mockResolvedValue(false);
    vi.mocked(teamRepository.isNumberAssigned).mockResolvedValue(false);
    vi.mocked(teamRepository.assignPlayer).mockResolvedValue(mockAssignment);
    vi.mocked(playerRepository.update).mockResolvedValue(mockPlayer);

    const result = await service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL, 7);

    expect(playerRepository.findById).toHaveBeenCalledWith('p1');
    expect(teamRepository.isNumberAssigned).toHaveBeenCalledWith('t1', 7);
    expect(playerRepository.update).toHaveBeenCalledWith('p1', { isGoalkeeper: false });
    expect(result).toEqual(mockAssignment);
  });

  it('assignPlayer throws error if player not found', async () => {
    vi.mocked(playerRepository.findById).mockResolvedValue(null);

    await expect(service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL, 7)).rejects.toThrow(
      'Player not found',
    );
    expect(teamRepository.assignPlayer).not.toHaveBeenCalled();
    expect(playerRepository.update).not.toHaveBeenCalled();
  });

  it('assignPlayer throws error if player already assigned', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };

    vi.mocked(playerRepository.findById).mockResolvedValue(mockPlayer);
    vi.mocked(teamRepository.isPlayerAssigned).mockResolvedValue(true);

    await expect(service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL, 7)).rejects.toThrow(
      'Player already assigned to this team',
    );
    expect(teamRepository.assignPlayer).not.toHaveBeenCalled();
    expect(playerRepository.update).not.toHaveBeenCalled();
  });

  it('assignPlayer rejects invalid position', async () => {
    await expect(service.assignPlayer('t1', 'p1', 999, 7)).rejects.toThrow('Invalid position');
    expect(playerRepository.findById).not.toHaveBeenCalled();
    expect(teamRepository.assignPlayer).not.toHaveBeenCalled();
    expect(playerRepository.update).not.toHaveBeenCalled();
  });

  it('assignPlayer marks goalkeeper when assignment position is goalkeeper', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.GOALKEEPER,
    };

    vi.mocked(playerRepository.findById).mockResolvedValue(mockPlayer);
    vi.mocked(teamRepository.isPlayerAssigned).mockResolvedValue(false);
    vi.mocked(teamRepository.hasGoalkeeperAssignment).mockResolvedValue(true);
    vi.mocked(teamRepository.isNumberAssigned).mockResolvedValue(false);
    vi.mocked(teamRepository.assignPlayer).mockResolvedValue(mockAssignment);
    vi.mocked(playerRepository.update).mockResolvedValue({ ...mockPlayer, isGoalkeeper: true });

    await service.assignPlayer('t1', 'p1', PLAYER_POSITION.GOALKEEPER, 7);

    expect(playerRepository.update).toHaveBeenCalledWith('p1', { isGoalkeeper: true });
  });

  it('updatePlayerAssignment validates position and delegates', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const updatedAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.CENTRAL,
    };
    vi.mocked(teamRepository.updatePlayerAssignment).mockResolvedValue(updatedAssignment as any);
    vi.mocked(teamRepository.hasGoalkeeperAssignment).mockResolvedValue(false);
    vi.mocked(playerRepository.update).mockResolvedValue(mockPlayer);

    const result = await service.updatePlayerAssignment('t1', 'p1', {
      position: PLAYER_POSITION.CENTRAL,
    });

    expect(teamRepository.updatePlayerAssignment).toHaveBeenCalledWith('t1', 'p1', {
      position: PLAYER_POSITION.CENTRAL,
    });
    expect(playerRepository.update).toHaveBeenCalledWith('p1', { isGoalkeeper: false });
    expect(result).toEqual(updatedAssignment);
  });

  it('updatePlayerAssignment rejects invalid position', async () => {
    await expect(service.updatePlayerAssignment('t1', 'p1', { position: 999 })).rejects.toThrow(
      'Invalid position',
    );
    expect(teamRepository.updatePlayerAssignment).not.toHaveBeenCalled();
    expect(playerRepository.update).not.toHaveBeenCalled();
  });

  it('unassignPlayer syncs goalkeeper flag', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.GOALKEEPER,
    };
    vi.mocked(teamRepository.unassignPlayer).mockResolvedValue(mockAssignment as any);
    vi.mocked(teamRepository.hasGoalkeeperAssignment).mockResolvedValue(false);
    vi.mocked(playerRepository.update).mockResolvedValue(mockPlayer);

    const result = await service.unassignPlayer('t1', 'p1');

    expect(teamRepository.unassignPlayer).toHaveBeenCalledWith('t1', 'p1');
    expect(playerRepository.update).toHaveBeenCalledWith('p1', { isGoalkeeper: false });
    expect(result).toEqual(mockAssignment);
  });
});

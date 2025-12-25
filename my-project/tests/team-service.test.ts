/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '../src/services/team-service';
import { TeamRepository } from '../src/repositories/team-repository';
import prisma from '../src/lib/prisma';
import { PLAYER_POSITION } from '../src/types/player-position';
import { Handedness } from '@prisma/client';

vi.mock('../src/repositories/team-repository');
vi.mock('../src/lib/prisma', () => ({
  default: {
    club: {
      findUnique: vi.fn(),
    },
    season: {
      findUnique: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    playerTeamSeason: {
      findFirst: vi.fn(),
    },
  },
}));

describe('TeamService', () => {
  let service: TeamService;
  let repository: TeamRepository;

  beforeEach(() => {
    repository = new TeamRepository();
    service = new TeamService(repository);
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
    vi.mocked(repository.findAll).mockResolvedValue(mockTeams);

    const result = await service.getAll();

    expect(repository.findAll).toHaveBeenCalled();
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

    vi.mocked(prisma.season.findUnique).mockResolvedValue({ id: 's1' } as any);
    vi.mocked(repository.create).mockResolvedValue(createdTeam as any);

    const result = await service.create(data);

    expect(prisma.season.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(repository.create).toHaveBeenCalled();
    expect(result).toEqual(createdTeam);
  });

  it('create throws error if season not found when seasonId provided', async () => {
    const newTeamData = {
      name: 'test-Test',
      category: 'Senior M',
      clubId: 'c1',
      seasonId: 'invalid',
    };
    vi.mocked(prisma.season.findUnique).mockResolvedValue(null);

    await expect(service.create(newTeamData)).rejects.toThrow('Season not found');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('assignPlayer validates player exists', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      number: 7,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.CENTRAL,
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);
    vi.mocked(prisma.playerTeamSeason.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(repository.assignPlayer).mockResolvedValue(mockAssignment);

    const result = await service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL);

    expect(prisma.player.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isGoalkeeper: false },
    });
    expect(result).toEqual(mockAssignment);
  });

  it('assignPlayer throws error if player not found', async () => {
    vi.mocked(prisma.player.findUnique).mockResolvedValue(null);

    await expect(service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL)).rejects.toThrow(
      'Player not found',
    );
    expect(repository.assignPlayer).not.toHaveBeenCalled();
    expect(prisma.player.update).not.toHaveBeenCalled();
  });

  it('assignPlayer throws error if player already assigned', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      number: 7,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const existingAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.CENTRAL,
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(existingAssignment);

    await expect(service.assignPlayer('t1', 'p1', PLAYER_POSITION.CENTRAL)).rejects.toThrow(
      'Player already assigned to this team',
    );
    expect(repository.assignPlayer).not.toHaveBeenCalled();
    expect(prisma.player.update).not.toHaveBeenCalled();
  });

  it('assignPlayer rejects invalid position', async () => {
    await expect(service.assignPlayer('t1', 'p1', 999)).rejects.toThrow('Invalid position');
    expect(prisma.player.findUnique).not.toHaveBeenCalled();
    expect(repository.assignPlayer).not.toHaveBeenCalled();
    expect(prisma.player.update).not.toHaveBeenCalled();
  });

  it('assignPlayer marks goalkeeper when assignment position is goalkeeper', async () => {
    const mockPlayer = {
      id: 'p1',
      name: 'test-Marc',
      number: 7,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.GOALKEEPER,
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);
    vi.mocked(prisma.playerTeamSeason.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'a1' } as any);
    vi.mocked(repository.assignPlayer).mockResolvedValue(mockAssignment);

    await service.assignPlayer('t1', 'p1', PLAYER_POSITION.GOALKEEPER);

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isGoalkeeper: true },
    });
  });

  it('updatePlayerPosition validates position and delegates', async () => {
    const updatedAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.CENTRAL,
    };
    vi.mocked(repository.updatePlayerPosition).mockResolvedValue(updatedAssignment as any);
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(null);

    const result = await service.updatePlayerPosition('t1', 'p1', PLAYER_POSITION.CENTRAL);

    expect(repository.updatePlayerPosition).toHaveBeenCalledWith(
      't1',
      'p1',
      PLAYER_POSITION.CENTRAL,
    );
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isGoalkeeper: false },
    });
    expect(result).toEqual(updatedAssignment);
  });

  it('updatePlayerPosition rejects invalid position', async () => {
    await expect(service.updatePlayerPosition('t1', 'p1', 999)).rejects.toThrow('Invalid position');
    expect(repository.updatePlayerPosition).not.toHaveBeenCalled();
    expect(prisma.player.update).not.toHaveBeenCalled();
  });

  it('unassignPlayer syncs goalkeeper flag', async () => {
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      position: PLAYER_POSITION.GOALKEEPER,
    };
    vi.mocked(repository.unassignPlayer).mockResolvedValue(mockAssignment as any);
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(null);

    const result = await service.unassignPlayer('t1', 'p1');

    expect(repository.unassignPlayer).toHaveBeenCalledWith('t1', 'p1');
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isGoalkeeper: false },
    });
    expect(result).toEqual(mockAssignment);
  });
});

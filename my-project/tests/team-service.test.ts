/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '../src/services/team-service';
import { TeamRepository } from '../src/repositories/team-repository';
import prisma from '../src/lib/prisma';

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
        name: 'Cadet A',
        category: 'CADET',
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
      name: 'New Team',
      category: 'SENIOR',
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
    const newTeamData = { name: 'Test', category: 'SENIOR', clubId: 'c1', seasonId: 'invalid' };
    vi.mocked(prisma.season.findUnique).mockResolvedValue(null);

    await expect(service.create(newTeamData)).rejects.toThrow('Season not found');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('assignPlayer validates player exists', async () => {
    const mockPlayer = { id: 'p1', name: 'Marc', number: 7, handedness: 'RIGHT' };
    const mockAssignment = { id: 'a1', teamId: 't1', playerId: 'p1', role: 'Player' };

    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(null);
    vi.mocked(repository.assignPlayer).mockResolvedValue(mockAssignment);

    const result = await service.assignPlayer('t1', 'p1', 'Player');

    expect(prisma.player.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(result).toEqual(mockAssignment);
  });

  it('assignPlayer throws error if player not found', async () => {
    vi.mocked(prisma.player.findUnique).mockResolvedValue(null);

    await expect(service.assignPlayer('t1', 'p1')).rejects.toThrow('Player not found');
    expect(repository.assignPlayer).not.toHaveBeenCalled();
  });

  it('assignPlayer throws error if player already assigned', async () => {
    const mockPlayer = { id: 'p1', name: 'Marc', number: 7, handedness: 'RIGHT' };
    const existingAssignment = { id: 'a1', teamId: 't1', playerId: 'p1', role: 'Player' };

    vi.mocked(prisma.player.findUnique).mockResolvedValue(mockPlayer);
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(existingAssignment);

    await expect(service.assignPlayer('t1', 'p1')).rejects.toThrow(
      'Player already assigned to this team',
    );
    expect(repository.assignPlayer).not.toHaveBeenCalled();
  });
});

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
    const mockTeams = [{ id: '1', name: 'Cadet A' }];
    vi.mocked(repository.findAll).mockResolvedValue(mockTeams);

    const result = await service.getAll();

    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockTeams);
  });

  it('create validates club and season exist', async () => {
    const newTeamData = { name: 'Juvenil B', clubId: 'c1', seasonId: 's1' };
    const mockClub = { id: 'c1', name: 'Mataró' };
    const mockSeason = { id: 's1', name: '2024-2025' };
    const createdTeam = { id: 't1', ...newTeamData };

    vi.mocked(prisma.club.findUnique).mockResolvedValue(mockClub);
    vi.mocked(prisma.season.findUnique).mockResolvedValue(mockSeason);
    vi.mocked(repository.create).mockResolvedValue(createdTeam);

    const result = await service.create(newTeamData);

    expect(prisma.club.findUnique).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(prisma.season.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(repository.create).toHaveBeenCalledWith(newTeamData);
    expect(result).toEqual(createdTeam);
  });

  it('create throws error Club not found', async () => {
    const newTeamData = { name: 'Test', clubId: 'invalid', seasonId: 's1' };
    vi.mocked(prisma.club.findUnique).mockResolvedValue(null);

    await expect(service.create(newTeamData)).rejects.toThrow('Club not found');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('create throws error if season not found', async () => {
    const newTeamData = { name: 'Test', clubId: 'c1', seasonId: 'invalid' };
    const mockClub = { id: 'c1', name: 'Mataró' };
    vi.mocked(prisma.club.findUnique).mockResolvedValue(mockClub);
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

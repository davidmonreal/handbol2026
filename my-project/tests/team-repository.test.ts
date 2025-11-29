import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamRepository } from '../src/repositories/team-repository';
import prisma from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
  default: {
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    playerTeamSeason: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('TeamRepository', () => {
  let repository: TeamRepository;

  beforeEach(() => {
    repository = new TeamRepository();
    vi.clearAllMocks();
  });

  it('findAll returns all teams with club, season and players', async () => {
    const mockTeams = [
      {
        id: '1',
        name: 'Cadet A',
        clubId: 'c1',
        seasonId: 's1',
        club: { id: 'c1', name: 'Mataró' },
        season: { id: 's1', name: '2024-2025' },
        players: [],
      },
    ];
    vi.mocked(prisma.team.findMany).mockResolvedValue(mockTeams);

    const result = await repository.findAll();

    expect(prisma.team.findMany).toHaveBeenCalledWith({
      include: {
        club: true,
        season: true,
        players: { include: { player: true } },
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(mockTeams);
  });

  it('findById returns a team by id with relations', async () => {
    const mockTeam = {
      id: '1',
      name: 'Cadet A',
      clubId: 'c1',
      seasonId: 's1',
      club: { id: 'c1', name: 'Mataró' },
      season: { id: 's1', name: '2024-2025' },
      players: [],
    };
    vi.mocked(prisma.team.findUnique).mockResolvedValue(mockTeam);

    const result = await repository.findById('1');

    expect(prisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: {
        club: true,
        season: true,
        players: { include: { player: true } },
      },
    });
    expect(result).toEqual(mockTeam);
  });

  it('create creates a new team', async () => {
    const newTeamData = { name: 'Juvenil B', clubId: 'c1', seasonId: 's1' };
    const createdTeam = { id: '2', ...newTeamData, club: {}, season: {} };
    vi.mocked(prisma.team.create).mockResolvedValue(createdTeam);

    const result = await repository.create(newTeamData);

    expect(prisma.team.create).toHaveBeenCalledWith({
      data: newTeamData,
      include: { club: true, season: true },
    });
    expect(result).toEqual(createdTeam);
  });

  it('assignPlayer adds a player to a team', async () => {
    const mockAssignment = {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      role: 'Player',
      player: { id: 'p1', name: 'Marc' },
      team: { id: 't1', name: 'Cadet A' },
    };
    vi.mocked(prisma.playerTeamSeason.create).mockResolvedValue(mockAssignment);

    const result = await repository.assignPlayer('t1', 'p1', 'Player');

    expect(prisma.playerTeamSeason.create).toHaveBeenCalledWith({
      data: { teamId: 't1', playerId: 'p1', role: 'Player' },
      include: { player: true, team: true },
    });
    expect(result).toEqual(mockAssignment);
  });

  it('unassignPlayer removes a player from a team', async () => {
    const mockAssignment = { id: 'a1', teamId: 't1', playerId: 'p1', role: 'Player' };
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(mockAssignment);
    vi.mocked(prisma.playerTeamSeason.delete).mockResolvedValue(mockAssignment);

    const result = await repository.unassignPlayer('t1', 'p1');

    expect(prisma.playerTeamSeason.findFirst).toHaveBeenCalledWith({
      where: { teamId: 't1', playerId: 'p1' },
    });
    expect(prisma.playerTeamSeason.delete).toHaveBeenCalledWith({
      where: { id: 'a1' },
    });
    expect(result).toEqual(mockAssignment);
  });

  it('unassignPlayer throws error if player not assigned', async () => {
    vi.mocked(prisma.playerTeamSeason.findFirst).mockResolvedValue(null);

    await expect(repository.unassignPlayer('t1', 'p1')).rejects.toThrow(
      'Player not assigned to this team',
    );
  });
});

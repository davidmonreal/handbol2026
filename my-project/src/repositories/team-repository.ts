import { Team, PlayerTeamSeason } from '@prisma/client';
import prisma from '../lib/prisma';

export class TeamRepository {
  async findAll(): Promise<Team[]> {
    return prisma.team.findMany({
      include: {
        club: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
        players: {
          select: { id: true }, // Only fetch IDs for counting, not full player data
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        clubId: true,
        seasonId: true,
        isMyTeam: true,
        club: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
        players: {
          select: {
            player: {
              select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
            },
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    category: string;
    clubId: string;
    seasonId: string;
    isMyTeam?: boolean;
  }): Promise<Team> {
    return prisma.team.create({
      data: {
        ...data,
        isMyTeam: data.isMyTeam ?? false,
      },
      select: {
        id: true,
        name: true,
        category: true,
        clubId: true,
        seasonId: true,
        isMyTeam: true,
        club: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
        players: {
          select: {
            player: {
              select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      clubId: string;
      seasonId: string;
      isMyTeam: boolean;
    }>,
  ): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        category: true,
        clubId: true,
        seasonId: true,
        isMyTeam: true,
        club: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
        players: {
          select: {
            player: {
              select: { id: true, name: true, number: true, handedness: true, isGoalkeeper: true },
            },
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Team> {
    await prisma.match.deleteMany({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
      },
    });
    return prisma.team.delete({
      where: { id },
    });
  }

  async getTeamPlayers(teamId: string): Promise<PlayerTeamSeason[]> {
    return prisma.playerTeamSeason.findMany({
      where: { teamId },
      include: {
        player: true,
      },
    });
  }

  async countBySeason(seasonId: string): Promise<number> {
    return prisma.team.count({
      where: { seasonId },
    });
  }

  async assignPlayer(
    teamId: string,
    playerId: string,
    role: string = 'Player',
  ): Promise<PlayerTeamSeason> {
    return prisma.playerTeamSeason.create({
      data: {
        teamId,
        playerId,
        role,
      },
      select: {
        id: true,
        teamId: true,
        playerId: true,
        role: true,
        player: { select: { id: true, name: true, number: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  async unassignPlayer(teamId: string, playerId: string): Promise<PlayerTeamSeason> {
    const assignment = await prisma.playerTeamSeason.findFirst({
      where: {
        teamId,
        playerId,
      },
    });

    if (!assignment) {
      throw new Error('Player not assigned to this team');
    }

    return prisma.playerTeamSeason.delete({
      where: { id: assignment.id },
    });
  }
}

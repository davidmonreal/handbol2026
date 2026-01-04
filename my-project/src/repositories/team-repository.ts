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
            id: true,
            number: true,
            position: true,
            player: {
              select: { id: true, name: true, handedness: true, isGoalkeeper: true },
            },
          },
        },
      },
    });
  }

  async exists(id: string): Promise<boolean> {
    const team = await prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });
    return team !== null;
  }

  async findTeamWithPlayerPositions(
    id: string,
  ): Promise<{ players: { position: number | null; player: { id: string } }[] } | null> {
    return prisma.team.findUnique({
      where: { id },
      select: {
        players: {
          select: {
            position: true,
            player: { select: { id: true } },
          },
        },
      },
    });
  }

  async hasGoalkeeperAssignment(playerId: string): Promise<boolean> {
    const assignment = await prisma.playerTeamSeason.findFirst({
      where: { playerId, position: 1 }, // GOALKEEPER position
      select: { id: true },
    });
    return assignment !== null;
  }

  async isPlayerAssigned(teamId: string, playerId: string): Promise<boolean> {
    const assignment = await prisma.playerTeamSeason.findFirst({
      where: { teamId, playerId },
      select: { id: true },
    });
    return assignment !== null;
  }

  async isNumberAssigned(teamId: string, number: number, playerId?: string): Promise<boolean> {
    const assignment = await prisma.playerTeamSeason.findFirst({
      where: playerId ? { teamId, number, playerId: { not: playerId } } : { teamId, number },
      select: { id: true },
    });
    return assignment !== null;
  }

  async findPlayerNumbers(
    teamId: string,
    playerIds: string[],
  ): Promise<Array<{ playerId: string; number: number }>> {
    if (playerIds.length === 0) return [];
    return prisma.playerTeamSeason.findMany({
      where: { teamId, playerId: { in: playerIds } },
      select: { playerId: true, number: true },
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
            id: true,
            number: true,
            position: true,
            player: {
              select: { id: true, name: true, handedness: true, isGoalkeeper: true },
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
            id: true,
            number: true,
            position: true,
            player: {
              select: { id: true, name: true, handedness: true, isGoalkeeper: true },
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
    position: number,
    number: number,
  ): Promise<PlayerTeamSeason> {
    return prisma.playerTeamSeason.create({
      data: {
        teamId,
        playerId,
        number,
        position,
      },
      select: {
        id: true,
        teamId: true,
        playerId: true,
        number: true,
        position: true,
        player: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  async updatePlayerAssignment(
    teamId: string,
    playerId: string,
    data: { position?: number; number?: number },
  ): Promise<PlayerTeamSeason> {
    const assignment = await prisma.playerTeamSeason.findFirst({
      where: { teamId, playerId },
      select: { id: true },
    });

    if (!assignment) {
      throw new Error('Player not assigned to this team');
    }

    return prisma.playerTeamSeason.update({
      where: { id: assignment.id },
      data,
      select: {
        id: true,
        teamId: true,
        playerId: true,
        number: true,
        position: true,
        player: { select: { id: true, name: true } },
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

import { Team, PlayerTeamSeason } from '@prisma/client';
import prisma from '../lib/prisma';

export class TeamRepository {
  async findAll(): Promise<Team[]> {
    return prisma.team.findMany({
      include: {
        club: true,
        season: true,
        players: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { id },
      include: {
        club: true,
        season: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });
  }

  async create(data: { name: string; clubId: string; seasonId: string }): Promise<Team> {
    return prisma.team.create({
      data,
      include: {
        club: true,
        season: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{ name: string; clubId: string; seasonId: string }>,
  ): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data,
      include: {
        club: true,
        season: true,
      },
    });
  }

  async delete(id: string): Promise<Team> {
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
      include: {
        player: true,
        team: true,
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

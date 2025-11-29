/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, Team, PlayerTeamSeason, Player } from '@prisma/client';
import { TeamRepository } from '../repositories/team-repository';
import prisma from '../lib/prisma';

export class TeamService {
  constructor(private repository: TeamRepository) { }

  async getAll(): Promise<Team[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Team | null> {
    return this.repository.findById(id);
  }

  async create(data: { name: string; category: string; clubId: string; seasonId: string; isMyTeam?: boolean }): Promise<Team> {
    // Validate club exists
    const club = await prisma.club.findUnique({ where: { id: data.clubId } });
    if (!club) throw new Error('Club not found');

    // Validate season exists
    const season = await prisma.season.findUnique({ where: { id: data.seasonId } });
    if (!season) throw new Error('Season not found');

    return this.repository.create(data);
  }

  async update(
    id: string,
    data: Partial<{ name: string; category: string; clubId: string; seasonId: string; isMyTeam?: boolean }>,
  ): Promise<Team> {
    // Validate club if provided
    if (data.clubId) {
      const club = await prisma.club.findUnique({ where: { id: data.clubId } });
      if (!club) {
        throw new Error('Club not found');
      }
    }

    // Validate season if provided
    if (data.seasonId) {
      const season = await prisma.season.findUnique({ where: { id: data.seasonId } });
      if (!season) {
        throw new Error('Season not found');
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<Team> {
    return this.repository.delete(id);
  }

  async getTeamPlayers(teamId: string): Promise<PlayerTeamSeason[]> {
    return this.repository.getTeamPlayers(teamId);
  }

  async assignPlayer(
    teamId: string,
    playerId: string,
    role: string = 'Player',
  ): Promise<PlayerTeamSeason> {
    // Check if player exists
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player already assigned to this team
    const existing = await prisma.playerTeamSeason.findFirst({
      where: { teamId, playerId },
    });
    if (existing) {
      throw new Error('Player already assigned to this team');
    }

    return this.repository.assignPlayer(teamId, playerId, role);
  }

  async unassignPlayer(teamId: string, playerId: string): Promise<PlayerTeamSeason> {
    return this.repository.unassignPlayer(teamId, playerId);
  }
}

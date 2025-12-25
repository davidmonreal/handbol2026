/* eslint-disable @typescript-eslint/no-unused-vars */
import { Team, PlayerTeamSeason } from '@prisma/client';
import { BaseService } from './base-service';
import { TeamRepository } from '../repositories/team-repository';
import prisma from '../lib/prisma'; // Keep prisma import for custom validation in create/update
import { isValidPlayerPosition, PLAYER_POSITION } from '../types/player-position';

export class TeamService extends BaseService<Team> {
  constructor(private teamRepository: TeamRepository) {
    super(teamRepository);
  }

  private async syncPlayerGoalkeeperStatus(playerId: string): Promise<void> {
    const hasGoalkeeperAssignment = await prisma.playerTeamSeason.findFirst({
      where: { playerId, position: PLAYER_POSITION.GOALKEEPER },
      select: { id: true },
    });
    await prisma.player.update({
      where: { id: playerId },
      data: { isGoalkeeper: Boolean(hasGoalkeeperAssignment) },
    });
  }

  // Override create to include custom validation and logic
  async create(data: {
    name: string;
    category: string;
    clubId?: string;
    clubName?: string;
    seasonId?: string;
    isMyTeam?: boolean;
  }): Promise<Team> {
    let clubId = data.clubId;

    // 1. Handle Club (Find or Create)
    if (!clubId && data.clubName) {
      // Check if club exists by name
      let club = await prisma.club.findFirst({ where: { name: data.clubName } });
      if (!club) {
        // Create new club
        club = await prisma.club.create({ data: { name: data.clubName } });
      }
      clubId = club.id;
    }

    if (!clubId) {
      throw new Error('Club ID or Club Name is required');
    }

    // 2. Handle Season (Default to current or latest)
    let seasonId = data.seasonId;
    if (!seasonId) {
      // Try to find a season that covers today
      const now = new Date();
      const currentSeason = await prisma.season.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (currentSeason) {
        seasonId = currentSeason.id;
      } else {
        // Fallback: find the latest season created
        const latestSeason = await prisma.season.findFirst({
          orderBy: { endDate: 'desc' },
        });
        if (latestSeason) {
          seasonId = latestSeason.id;
        } else {
          // Fallback: Create a default season
          const defaultSeason = await prisma.season.create({
            data: {
              name: `${now.getFullYear()}-${now.getFullYear() + 1}`,
              startDate: now,
              endDate: new Date(now.getFullYear() + 1, 5, 30), // June 30th next year
            },
          });
          seasonId = defaultSeason.id;
        }
      }
    }

    // Validate season exists (if passed explicitly)
    if (data.seasonId) {
      const season = await prisma.season.findUnique({ where: { id: data.seasonId } });
      if (!season) throw new Error('Season not found');
    }

    return this.teamRepository.create({
      name: data.name,
      category: data.category,
      clubId,
      seasonId,
      isMyTeam: data.isMyTeam,
    });
  }

  // Override update to include custom validation
  async update(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      clubId: string;
      seasonId: string;
      isMyTeam?: boolean;
    }>,
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
    return this.teamRepository.getTeamPlayers(teamId);
  }

  async assignPlayer(
    teamId: string,
    playerId: string,
    position: number,
  ): Promise<PlayerTeamSeason> {
    if (!isValidPlayerPosition(position)) {
      throw new Error('Invalid position');
    }

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

    const assignment = await this.teamRepository.assignPlayer(teamId, playerId, position);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }

  async unassignPlayer(teamId: string, playerId: string): Promise<PlayerTeamSeason> {
    const assignment = await this.teamRepository.unassignPlayer(teamId, playerId);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }

  async updatePlayerPosition(
    teamId: string,
    playerId: string,
    position: number,
  ): Promise<PlayerTeamSeason> {
    if (!isValidPlayerPosition(position)) {
      throw new Error('Invalid position');
    }
    const assignment = await this.teamRepository.updatePlayerPosition(teamId, playerId, position);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }
}

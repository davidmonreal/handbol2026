/* eslint-disable @typescript-eslint/no-unused-vars */
import { Team, PlayerTeamSeason } from '@prisma/client';
import { BaseService } from './base-service';
import { TeamRepository } from '../repositories/team-repository';
import { ClubRepository } from '../repositories/club-repository';
import { SeasonRepository } from '../repositories/season-repository';
import { PlayerRepository } from '../repositories/player-repository';
import { isValidPlayerPosition } from '../types/player-position';

export class TeamService extends BaseService<Team> {
  constructor(
    private teamRepository: TeamRepository,
    private clubRepository: ClubRepository,
    private seasonRepository: SeasonRepository,
    private playerRepository: PlayerRepository,
  ) {
    super(teamRepository);
  }

  private async syncPlayerGoalkeeperStatus(playerId: string): Promise<void> {
    const hasGoalkeeperAssignment = await this.teamRepository.hasGoalkeeperAssignment(playerId);
    await this.playerRepository.update(playerId, { isGoalkeeper: hasGoalkeeperAssignment });
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
      let club = await this.clubRepository.findByName(data.clubName);
      if (!club) {
        // Create new club
        club = await this.clubRepository.create({ name: data.clubName });
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
      const currentSeason = await this.seasonRepository.findCurrent();

      if (currentSeason) {
        seasonId = currentSeason.id;
      } else {
        // Fallback: find the latest season created
        const latestSeason = await this.seasonRepository.findLatest();
        if (latestSeason) {
          seasonId = latestSeason.id;
        } else {
          // Fallback: Create a default season
          const now = new Date();
          const defaultSeason = await this.seasonRepository.create({
            name: `${now.getFullYear()}-${now.getFullYear() + 1}`,
            startDate: now,
            endDate: new Date(now.getFullYear() + 1, 5, 30), // June 30th next year
          });
          seasonId = defaultSeason.id;
        }
      }
    }

    // Validate season exists (if passed explicitly)
    if (data.seasonId) {
      const season = await this.seasonRepository.findById(data.seasonId);
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
      const club = await this.clubRepository.findById(data.clubId);
      if (!club) {
        throw new Error('Club not found');
      }
    }

    // Validate season if provided
    if (data.seasonId) {
      const season = await this.seasonRepository.findById(data.seasonId);
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
    number: number,
  ): Promise<PlayerTeamSeason> {
    if (!isValidPlayerPosition(position)) {
      throw new Error('Invalid position');
    }

    // Check if player exists
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player already assigned to this team
    const isAssigned = await this.teamRepository.isPlayerAssigned(teamId, playerId);
    if (isAssigned) {
      throw new Error('Player already assigned to this team');
    }

    const isNumberTaken = await this.teamRepository.isNumberAssigned(teamId, number);
    if (isNumberTaken) {
      throw new Error('Player number already assigned to this team');
    }

    const assignment = await this.teamRepository.assignPlayer(teamId, playerId, position, number);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }

  async unassignPlayer(teamId: string, playerId: string): Promise<PlayerTeamSeason> {
    const assignment = await this.teamRepository.unassignPlayer(teamId, playerId);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }

  async updatePlayerAssignment(
    teamId: string,
    playerId: string,
    data: { position?: number; number?: number },
  ): Promise<PlayerTeamSeason> {
    if (data.position !== undefined && !isValidPlayerPosition(data.position)) {
      throw new Error('Invalid position');
    }
    if (data.number !== undefined) {
      const isNumberTaken = await this.teamRepository.isNumberAssigned(
        teamId,
        data.number,
        playerId,
      );
      if (isNumberTaken) {
        throw new Error('Player number already assigned to this team');
      }
    }
    const assignment = await this.teamRepository.updatePlayerAssignment(teamId, playerId, data);
    await this.syncPlayerGoalkeeperStatus(playerId);
    return assignment;
  }
}

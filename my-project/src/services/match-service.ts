/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Match } from '@prisma/client';
import { BaseService } from './base-service';
import { MatchRepository } from '../repositories/match-repository';
import { TeamRepository } from '../repositories/team-repository';
import { GameEventRepository } from '../repositories/game-event-repository';
import {
  createMatchSchema,
  updateMatchSchema,
  CreateMatchInput,
  UpdateMatchInput,
} from '../schemas';
import { ZodError, ZodIssue } from 'zod';

function mapMatchIssue(issue: ZodIssue | undefined) {
  // Normalize validation errors to predictable, user-facing wording
  const pathHead = Array.isArray(issue?.path) ? issue?.path[0] : undefined;
  if (pathHead === 'date') return 'Invalid date format';
  if (issue?.message) return issue.message;
  return 'Invalid match payload';
}

export class MatchService extends BaseService<Match> {
  constructor(
    private matchRepository: MatchRepository,
    private teamRepository: TeamRepository,
    private gameEventRepository: GameEventRepository,
  ) {
    super(matchRepository);
  }

  async getAll(): Promise<any[]> {
    // Scores are maintained in homeScore/awayScore columns by GameEventService
    // No need to fetch and filter events - significant performance improvement
    return this.matchRepository.findAll();
  }

  async findById(id: string): Promise<Match | null> {
    const match = await this.matchRepository.findById(id);
    if (!match) return null;

    const enrichTeamPositions = async (team: any) => {
      if (!team?.players?.length) return team;
      const hasMissingPositions = team.players.some((entry: any) => entry.position == null);
      if (!hasMissingPositions) return team;

      const teamWithPositions = await this.teamRepository.findTeamWithPlayerPositions(team.id);

      if (!teamWithPositions?.players?.length) return team;

      const positionByPlayerId = new Map(
        teamWithPositions.players.map((entry) => [entry.player.id, entry.position]),
      );

      return {
        ...team,
        players: team.players.map((entry: any) => ({
          ...entry,
          position: entry.position ?? positionByPlayerId.get(entry.player.id) ?? entry.position,
        })),
      };
    };

    const enrichedHome = await enrichTeamPositions((match as any).homeTeam);
    const enrichedAway = await enrichTeamPositions((match as any).awayTeam);

    const enrichedMatch = {
      ...match,
      homeTeam: enrichedHome,
      awayTeam: enrichedAway,
    };

    // No automatic recalculation: if match is finished, scores are manual (truth)
    // Goals only contribute to statistics when match is not finished
    return enrichedMatch;
  }

  async create(data: CreateMatchInput): Promise<Match> {
    let validated;
    try {
      validated = createMatchSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapMatchIssue(error.issues[0]));
      }
      throw error;
    }

    // Default finished matches without scores should keep zeros; frontend should send explicit values
    if (validated.isFinished && validated.homeScore === undefined) {
      validated.homeScore = 0;
    }
    if (validated.isFinished && validated.awayScore === undefined) {
      validated.awayScore = 0;
    }

    // Validate home team exists
    const homeTeamExists = await this.teamRepository.exists(validated.homeTeamId);
    if (!homeTeamExists) {
      throw new Error('Home team not found');
    }

    // Validate away team exists
    const awayTeamExists = await this.teamRepository.exists(validated.awayTeamId);
    if (!awayTeamExists) {
      throw new Error('Away team not found');
    }

    return super.create(validated);
  }

  async update(id: string, data: UpdateMatchInput): Promise<Match> {
    let updateData;
    try {
      updateData = updateMatchSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapMatchIssue(error.issues[0]));
      }
      throw error;
    }

    // Ensure scores default to zero when finished flag is set without scores
    if (updateData.isFinished && updateData.homeScore === undefined) {
      updateData.homeScore = 0;
    }
    if (updateData.isFinished && updateData.awayScore === undefined) {
      updateData.awayScore = 0;
    }

    // If updating teams, we need to check constraints
    if (updateData.homeTeamId || updateData.awayTeamId) {
      const currentMatch = await this.matchRepository.findById(id);
      if (!currentMatch) {
        throw new Error('Match not found');
      }

      const newHomeId = updateData.homeTeamId || currentMatch.homeTeamId;
      const newAwayId = updateData.awayTeamId || currentMatch.awayTeamId;

      if (newHomeId === newAwayId) {
        throw new Error('Home and Away teams must be different');
      }

      if (updateData.homeTeamId) {
        const homeTeamExists = await this.teamRepository.exists(updateData.homeTeamId);
        if (!homeTeamExists) throw new Error('Home team not found');
      }

      if (updateData.awayTeamId) {
        const awayTeamExists = await this.teamRepository.exists(updateData.awayTeamId);
        if (!awayTeamExists) throw new Error('Away team not found');
      }
    }

    return super.update(id, updateData);
  }

  async delete(id: string): Promise<Match> {
    // Delete related events first since we don't have cascade delete in schema
    await this.gameEventRepository.deleteByMatchId(id);
    return this.repository.delete(id);
  }
}

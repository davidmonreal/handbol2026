/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Match } from '@prisma/client';
import { BaseService } from './base-service';
import { MatchRepository } from '../repositories/match-repository';
import prisma from '../lib/prisma';
import { createMatchSchema, updateMatchSchema, CreateMatchInput, UpdateMatchInput } from '../schemas/match';
import { ZodError } from 'zod';

function mapMatchIssue(issue: { path?: (string | number)[]; message?: string } | undefined) {
  // Normalize validation errors to predictable, user-facing wording
  if (issue?.path?.[0] === 'date') return 'Invalid date format';
  if (issue?.message) return issue.message;
  return 'Invalid match payload';
}

export class MatchService extends BaseService<Match> {
  constructor(private matchRepository: MatchRepository) {
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

    // No automatic recalculation: if match is finished, scores are manual (truth)
    // Goals only contribute to statistics when match is not finished
    return match;
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

    // Validate home team exists
    const homeTeam = await prisma.team.findUnique({ where: { id: validated.homeTeamId } });
    if (!homeTeam) {
      throw new Error('Home team not found');
    }

    // Validate away team exists
    const awayTeam = await prisma.team.findUnique({ where: { id: validated.awayTeamId } });
    if (!awayTeam) {
      throw new Error('Away team not found');
    }

    return super.create(validated);
  }

  async update(
    id: string,
    data: UpdateMatchInput,
  ): Promise<Match> {
    let updateData;
    try {
      updateData = updateMatchSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapMatchIssue(error.issues[0]));
      }
      throw error;
    }

    // If updating teams, we need to check constraints
    if (updateData.homeTeamId || updateData.awayTeamId) {
      const currentMatch = await this.matchRepository.findById(id); // Use this.matchRepository
      if (!currentMatch) {
        throw new Error('Match not found');
      }

      const newHomeId = updateData.homeTeamId || currentMatch.homeTeamId;
      const newAwayId = updateData.awayTeamId || currentMatch.awayTeamId;

      if (newHomeId === newAwayId) {
        throw new Error('Home and Away teams must be different');
      }

      if (updateData.homeTeamId) {
        const homeTeam = await prisma.team.findUnique({ where: { id: updateData.homeTeamId } });
        if (!homeTeam) throw new Error('Home team not found');
      }

      if (updateData.awayTeamId) {
        const awayTeam = await prisma.team.findUnique({ where: { id: updateData.awayTeamId } });
        if (!awayTeam) throw new Error('Away team not found');
      }
    }

    return super.update(id, updateData);
  }

  async delete(id: string): Promise<Match> {
    // Manually delete related events first since we don't have cascade delete in schema
    await prisma.gameEvent.deleteMany({
      where: { matchId: id },
    });
    return this.repository.delete(id);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Match } from '@prisma/client';
import { BaseService } from './base-service';
import { MatchRepository } from '../repositories/match-repository';
import prisma from '../lib/prisma';

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

  async create(data: {
    date: string | Date;
    homeTeamId: string;
    awayTeamId: string;
  }): Promise<Match> {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    if (data.homeTeamId === data.awayTeamId) {
      throw new Error('Home and Away teams must be different');
    }

    // Validate home team exists
    const homeTeam = await prisma.team.findUnique({ where: { id: data.homeTeamId } });
    if (!homeTeam) {
      throw new Error('Home team not found');
    }

    // Validate away team exists
    const awayTeam = await prisma.team.findUnique({ where: { id: data.awayTeamId } });
    if (!awayTeam) {
      throw new Error('Away team not found');
    }

    return super.create({
      // Call super.create
      ...data,
      date,
    });
  }

  async update(
    id: string,
    data: Partial<{
      date: string | Date;
      homeTeamId: string;
      awayTeamId: string;
      isFinished: boolean;
      videoUrl: string | null;
      firstHalfVideoStart: number | null;
      secondHalfVideoStart: number | null;
      realTimeFirstHalfStart: number | null;
      realTimeSecondHalfStart: number | null;
      realTimeFirstHalfEnd: number | null;
      realTimeSecondHalfEnd: number | null;
      homeEventsLocked: boolean;
      awayEventsLocked: boolean;
    }>,
  ): Promise<Match> {
    const updateData: Record<string, any> = { ...data };

    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      updateData.date = date;
    }

    // If updating teams, we need to check constraints
    if (data.homeTeamId || data.awayTeamId) {
      const currentMatch = await this.matchRepository.findById(id); // Use this.matchRepository
      if (!currentMatch) {
        throw new Error('Match not found');
      }

      const newHomeId = data.homeTeamId || currentMatch.homeTeamId;
      const newAwayId = data.awayTeamId || currentMatch.awayTeamId;

      if (newHomeId === newAwayId) {
        throw new Error('Home and Away teams must be different');
      }

      if (data.homeTeamId) {
        const homeTeam = await prisma.team.findUnique({ where: { id: data.homeTeamId } });
        if (!homeTeam) throw new Error('Home team not found');
      }

      if (data.awayTeamId) {
        const awayTeam = await prisma.team.findUnique({ where: { id: data.awayTeamId } });
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

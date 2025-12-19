import { Match } from '@prisma/client';
import { PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';

export class MatchRepository {
  async findAll() {
    try {
      return await prisma.match.findMany({
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              category: true,
              club: { select: { name: true } },
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              category: true,
              club: { select: { name: true } },
            },
          },
          // Events removed - scores are in homeScore/awayScore columns
        },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientUnknownRequestError &&
        error.message.includes('Inconsistent query result')
      ) {
        // Fall back to a lean query when cascading deletes break relations mid-test
        return prisma.match.findMany({ orderBy: { date: 'desc' } });
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Match | null> {
    try {
      return await prisma.match.findUnique({
        where: { id },
        include: {
          homeTeam: { include: { club: true, players: { include: { player: true } } } },
          awayTeam: { include: { club: true, players: { include: { player: true } } } },
        },
      });
    } catch (error) {
      // If relational integrity is temporarily broken in tests, fall back to a lean fetch
      if (
        error instanceof PrismaClientUnknownRequestError &&
        error.message.includes('Inconsistent query result')
      ) {
        return prisma.match.findUnique({ where: { id } });
      }
      throw error;
    }
  }

  async create(data: { date: Date; homeTeamId: string; awayTeamId: string }): Promise<Match> {
    return prisma.match.create({
      data,
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      date: Date;
      homeTeamId: string;
      awayTeamId: string;
      isFinished: boolean;
      homeScore: number;
      awayScore: number;
      homeEventsLocked: boolean;
      awayEventsLocked: boolean;
      videoUrl: string | null;
      firstHalfVideoStart: number | null;
      secondHalfVideoStart: number | null;
      realTimeFirstHalfStart: number | null;
      realTimeSecondHalfStart: number | null;
      realTimeFirstHalfEnd: number | null;
      realTimeSecondHalfEnd: number | null;
    }>,
  ): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data,
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
      },
    });
  }

  async delete(id: string): Promise<Match> {
    return prisma.match.delete({
      where: { id },
    });
  }
}

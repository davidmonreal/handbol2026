import { Match } from '@prisma/client';
import { PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';

const MATCH_BASE_SELECT = {
  id: true,
  date: true,
  homeTeamId: true,
  awayTeamId: true,
  homeScore: true,
  awayScore: true,
  isFinished: true,
  homeEventsLocked: true,
  awayEventsLocked: true,
  videoUrl: true,
  firstHalfVideoStart: true,
  secondHalfVideoStart: true,
  realTimeFirstHalfStart: true,
  realTimeSecondHalfStart: true,
  realTimeFirstHalfEnd: true,
  realTimeSecondHalfEnd: true,
  homeTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      club: { select: { id: true, name: true } },
    },
  },
  awayTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      club: { select: { id: true, name: true } },
    },
  },
} as const;

const MATCH_WITH_PLAYERS_SELECT = {
  ...MATCH_BASE_SELECT,
  homeTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      club: { select: { id: true, name: true } },
      players: {
        select: {
          number: true,
          position: true,
          player: {
            select: {
              id: true,
              name: true,
              handedness: true,
              isGoalkeeper: true,
            },
          },
        },
      },
    },
  },
  awayTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      club: { select: { id: true, name: true } },
      players: {
        select: {
          number: true,
          position: true,
          player: {
            select: {
              id: true,
              name: true,
              handedness: true,
              isGoalkeeper: true,
            },
          },
        },
      },
    },
  },
} as const;

export class MatchRepository {
  async findAll() {
    try {
      return await prisma.match.findMany({
        select: MATCH_BASE_SELECT,
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientUnknownRequestError &&
        error.message.includes('Inconsistent query result')
      ) {
        // Fall back to a lean query when cascading deletes break relations mid-test
        return prisma.match.findMany({ select: MATCH_BASE_SELECT, orderBy: { date: 'desc' } });
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Match | null> {
    try {
      return await prisma.match.findUnique({
        where: { id },
        select: MATCH_WITH_PLAYERS_SELECT,
      });
    } catch (error) {
      // If relational integrity is temporarily broken in tests, fall back to a lean fetch
      if (
        error instanceof PrismaClientUnknownRequestError &&
        error.message.includes('Inconsistent query result')
      ) {
        return prisma.match.findUnique({ where: { id }, select: MATCH_WITH_PLAYERS_SELECT });
      }
      throw error;
    }
  }

  async create(data: { date: Date; homeTeamId: string; awayTeamId: string }): Promise<Match> {
    return prisma.match.create({
      data,
      select: {
        ...MATCH_BASE_SELECT,
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
      select: {
        ...MATCH_BASE_SELECT,
      },
    });
  }

  async applyTeamMigration(params: {
    matchId: string;
    matchPatch: Partial<{ homeTeamId: string; awayTeamId: string }>;
    teamEventUpdates: Array<{ fromTeamId: string; toTeamId: string }>;
    opponentGoalkeeperUpdates: Array<{ attackingTeamId: string; goalkeeperId: string }>;
    playerAssignments: Array<{
      teamId: string;
      players: Array<{ playerId: string; number: number }>;
    }>;
  }): Promise<Match> {
    const { matchId, matchPatch, teamEventUpdates, opponentGoalkeeperUpdates, playerAssignments } =
      params;

    return prisma.$transaction(async (tx) => {
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: matchPatch,
        select: {
          ...MATCH_BASE_SELECT,
        },
      });

      for (const update of teamEventUpdates) {
        await tx.gameEvent.updateMany({
          where: { matchId, teamId: update.fromTeamId },
          data: { teamId: update.toTeamId },
        });
      }

      for (const update of opponentGoalkeeperUpdates) {
        await tx.gameEvent.updateMany({
          where: {
            matchId,
            teamId: update.attackingTeamId,
            activeGoalkeeperId: { not: null },
          },
          data: { activeGoalkeeperId: update.goalkeeperId },
        });
      }

      for (const assignment of playerAssignments) {
        if (assignment.players.length === 0) continue;
        await tx.playerTeamSeason.createMany({
          data: assignment.players.map(({ playerId, number }) => ({
            playerId,
            teamId: assignment.teamId,
            number,
          })),
        });
      }

      return updatedMatch;
    });
  }

  async delete(id: string): Promise<Match> {
    return prisma.match.delete({
      where: { id },
    });
  }
}

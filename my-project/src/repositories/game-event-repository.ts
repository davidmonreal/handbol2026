/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, GameEvent } from '@prisma/client';
import prisma from '../lib/prisma';

export class GameEventRepository {
  async findAll(filters?: { teamId?: string; playerId?: string }): Promise<GameEvent[]> {
    const where: Record<string, string> = {};
    if (filters?.teamId) where.teamId = filters.teamId;
    if (filters?.playerId) where.playerId = filters.playerId;

    return prisma.gameEvent.findMany({
      where,
      include: {
        player: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findByMatchId(matchId: string): Promise<GameEvent[]> {
    return prisma.gameEvent.findMany({
      where: { matchId },
      include: {
        player: true,
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findById(id: string): Promise<GameEvent | null> {
    return prisma.gameEvent.findUnique({
      where: { id },
      include: {
        player: true,
        match: true,
      },
    });
  }

  async create(data: {
    matchId: string;
    timestamp: number;
    playerId?: string;
    teamId: string;
    type: string;
    subtype?: string;
    position?: string;
    distance?: string;
    isCollective?: boolean;
    goalZone?: string;
    sanctionType?: string;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
  }): Promise<GameEvent> {
    return prisma.gameEvent.create({
      data,
      include: {
        player: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      timestamp: number;
      playerId: string;
      type: string;
      subtype: string;
      position: string;
      distance: string;
      isCollective: boolean;
      goalZone: string;
      sanctionType: string;
      hasOpposition: boolean;
      isCounterAttack: boolean;
    }>,
  ): Promise<GameEvent> {
    return prisma.gameEvent.update({
      where: { id },
      data,
      include: {
        player: true,
      },
    });
  }

  async delete(id: string): Promise<GameEvent> {
    return prisma.gameEvent.delete({
      where: { id },
    });
  }
}

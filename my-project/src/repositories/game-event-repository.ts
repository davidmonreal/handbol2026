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
        activeGoalkeeper: true,
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
    activeGoalkeeperId?: string;
  }): Promise<GameEvent> {
    // derive canonical zone for storage
    const deriveZone = (position?: string, distance?: string): string | undefined => {
      if (distance === '7M') return '7m';
      if (!position || !distance) return undefined;
      const prefix = distance === '6M' ? '6m' : '9m';
      return `${prefix}-${position.toUpperCase()}`;
    };

    const zone = deriveZone(data.position, data.distance);
    const dataWithZone = { ...data, zone };

    return prisma.gameEvent.create({
      data: dataWithZone,
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
      activeGoalkeeperId: string;
    }>,
  ): Promise<GameEvent> {
    // If position/distance are being updated, recalculate zone
    const deriveZone = (position?: string, distance?: string): string | undefined => {
      if (distance === '7M') return '7m';
      if (!position || !distance) return undefined;
      const prefix = distance === '6M' ? '6m' : '9m';
      return `${prefix}-${position.toUpperCase()}`;
    };

    const shouldDerive = 'position' in data || 'distance' in data || 'goalZone' in data;
    let updateData: Record<string, unknown> = { ...data };
    if (shouldDerive) {
      // If position/distance present in partial update use them, otherwise fetch current values
      const current = await prisma.gameEvent.findUnique({ where: { id } });
      const position = data.position ?? current?.position;
      const distance = data.distance ?? current?.distance;
      const zone = deriveZone(position, distance);
      updateData = { ...data, zone };
    }

    return prisma.gameEvent.update({
      where: { id },
      data: updateData,
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

import { PrismaClient, GameEvent } from '@prisma/client';
import prisma from '../lib/prisma';

export class GameEventRepository {
    async findAll(): Promise<GameEvent[]> {
        return prisma.gameEvent.findMany({
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

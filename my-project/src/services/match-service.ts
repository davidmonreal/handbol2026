import { PrismaClient, Match } from '@prisma/client';
import { MatchRepository } from '../repositories/match-repository';
import prisma from '../lib/prisma';

export class MatchService {
    constructor(private repository: MatchRepository) { }

    async getAll(): Promise<Match[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<Match | null> {
        return this.repository.findById(id);
    }

    async create(data: { date: string | Date; homeTeamId: string; awayTeamId: string }): Promise<Match> {
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

        return this.repository.create({
            ...data,
            date
        });
    }

    async update(id: string, data: Partial<{ date: string | Date; homeTeamId: string; awayTeamId: string; isFinished: boolean }>): Promise<Match> {
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
            const currentMatch = await this.repository.findById(id);
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

        return this.repository.update(id, updateData);
    }

    async delete(id: string): Promise<Match> {
        return this.repository.delete(id);
    }
}

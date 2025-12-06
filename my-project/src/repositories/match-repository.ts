import { Match } from '@prisma/client';
import prisma from '../lib/prisma';

export class MatchRepository {
  async findAll() {
    return prisma.match.findMany({
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
        // Events removed - scores are in homeScore/awayScore columns
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string): Promise<Match | null> {
    return prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { club: true, players: { include: { player: true } } } },
        awayTeam: { include: { club: true, players: { include: { player: true } } } },
      },
    });
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

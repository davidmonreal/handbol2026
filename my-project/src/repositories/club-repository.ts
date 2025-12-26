import prisma from '../lib/prisma';
import { Club, Prisma } from '@prisma/client';

export interface IClubRepository {
  findAll(): Promise<Club[]>;
  findById(id: string): Promise<Club | null>;
  create(data: Prisma.ClubCreateInput): Promise<Club>;
  update(id: string, data: Prisma.ClubUpdateInput): Promise<Club>;
  delete(id: string): Promise<Club>;
}

export class ClubRepository implements IClubRepository {
  async findAll(): Promise<Club[]> {
    return prisma.club.findMany();
  }

  async findById(id: string): Promise<Club | null> {
    return prisma.club.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Club | null> {
    return prisma.club.findFirst({ where: { name } });
  }

  async create(data: Prisma.ClubCreateInput): Promise<Club> {
    return prisma.club.create({ data });
  }

  async update(id: string, data: Prisma.ClubUpdateInput): Promise<Club> {
    return prisma.club.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Club> {
    return prisma.$transaction(async (tx) => {
      // 1. Find teams associated with the club
      const teams = await tx.team.findMany({ where: { clubId: id } });
      const teamIds = teams.map((t) => t.id);

      if (teamIds.length > 0) {
        // 2. Find matches where these teams are involved
        const matches = await tx.match.findMany({
          where: {
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
          },
          select: { id: true },
        });
        const matchIds = matches.map((m) => m.id);

        if (matchIds.length > 0) {
          // 3. Delete GameEvents for these matches
          await tx.gameEvent.deleteMany({
            where: { matchId: { in: matchIds } },
          });

          // 4. Delete Matches
          await tx.match.deleteMany({
            where: { id: { in: matchIds } },
          });
        }

        // 5. Delete Teams (PlayerTeamSeason cascades automatically via schema)
        await tx.team.deleteMany({
          where: { id: { in: teamIds } },
        });
      }

      // 6. Delete Club
      return tx.club.delete({ where: { id } });
    });
  }
}

import { Player } from '@prisma/client';
import prisma from '../lib/prisma';

export class PlayerRepository {
  async findAll(): Promise<Player[]> {
    return prisma.player.findMany({
      include: {
        teams: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                category: true,
                club: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  private buildSearchWhere(params: { search?: string; clubId?: string }) {
    const { search, clubId } = params;
    const conditions: object[] = [];

    // Search by name
    if (search) {
      conditions.push({ name: { contains: search, mode: 'insensitive' as const } });
    }

    // Filter by club
    if (clubId) {
      conditions.push({
        teams: {
          some: {
            team: {
              clubId: clubId,
            },
          },
        },
      });
    }

    if (conditions.length === 0) return undefined;

    // If only clubId, return the club filter directly
    if (!search && clubId) {
      return conditions[0];
    }

    // If only search, return the search condition directly
    if (search && !clubId) {
      return { OR: conditions };
    }

    // If both, combine them with AND
    return { AND: conditions };
  }

  async findAllPaginated(params: { skip: number; take: number; search?: string; clubId?: string }): Promise<Player[]> {
    const { skip, take, search, clubId } = params;
    return prisma.player.findMany({
      where: this.buildSearchWhere({ search, clubId }),
      include: {
        teams: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                category: true,
                club: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    });
  }

  async count(params: { search?: string; clubId?: string }): Promise<number> {
    return prisma.player.count({
      where: this.buildSearchWhere(params),
    });
  }

  async findById(id: string): Promise<Player | null> {
    return prisma.player.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: Omit<Player, 'id'>): Promise<Player> {
    return prisma.player.create({
      data,
    });
  }

  async update(id: string, data: Partial<Omit<Player, 'id'>>): Promise<Player> {
    return prisma.player.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Player> {
    return prisma.player.delete({
      where: { id },
    });
  }
}

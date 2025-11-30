import { Player } from '@prisma/client';
import prisma from '../lib/prisma';

export class PlayerRepository {
  async findAll(): Promise<Player[]> {
    return prisma.player.findMany({
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
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Player | null> {
    return prisma.player.findUnique({
      where: { id },
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

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

  async create(data: Prisma.ClubCreateInput): Promise<Club> {
    return prisma.club.create({ data });
  }

  async update(id: string, data: Prisma.ClubUpdateInput): Promise<Club> {
    return prisma.club.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Club> {
    return prisma.club.delete({ where: { id } });
  }
}

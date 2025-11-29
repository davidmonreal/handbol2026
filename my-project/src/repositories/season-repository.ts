import { Season } from '@prisma/client';
import prisma from '../lib/prisma';

export class SeasonRepository {
    async findAll(): Promise<Season[]> {
        return prisma.season.findMany({
            orderBy: { startDate: 'desc' }
        });
    }

    async findById(id: string): Promise<Season | null> {
        return prisma.season.findUnique({
            where: { id }
        });
    }

    async create(data: Omit<Season, 'id'>): Promise<Season> {
        return prisma.season.create({
            data
        });
    }

    async update(id: string, data: Partial<Omit<Season, 'id'>>): Promise<Season> {
        return prisma.season.update({
            where: { id },
            data
        });
    }

    async delete(id: string): Promise<Season> {
        return prisma.season.delete({
            where: { id }
        });
    }
}

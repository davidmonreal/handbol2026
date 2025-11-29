import { Season } from '@prisma/client';
import { SeasonRepository } from '../repositories/season-repository';

export class SeasonService {
    constructor(private repository: SeasonRepository) { }

    async getAll(): Promise<Season[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<Season | null> {
        return this.repository.findById(id);
    }

    async create(data: Omit<Season, 'id'>): Promise<Season> {
        // Validation logic could go here (e.g., check if end date is after start date)
        if (data.endDate <= data.startDate) {
            throw new Error('End date must be after start date');
        }
        return this.repository.create(data);
    }

    async update(id: string, data: Partial<Omit<Season, 'id'>>): Promise<Season> {
        if (data.startDate && data.endDate && data.endDate <= data.startDate) {
            throw new Error('End date must be after start date');
        }
        return this.repository.update(id, data);
    }

    async delete(id: string): Promise<Season> {
        return this.repository.delete(id);
    }
}

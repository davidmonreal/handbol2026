import { Player } from '@prisma/client';
import { PlayerRepository } from '../repositories/player-repository';

export class PlayerService {
    constructor(private repository: PlayerRepository) { }

    async getAll(): Promise<Player[]> {
        return this.repository.findAll();
    }

    async getById(id: string): Promise<Player | null> {
        return this.repository.findById(id);
    }

    async create(data: Omit<Player, 'id'>): Promise<Player> {
        // Validation: number must be positive
        if (data.number <= 0) {
            throw new Error('Player number must be positive');
        }

        // Validation: handedness must be LEFT or RIGHT
        if (data.handedness !== 'LEFT' && data.handedness !== 'RIGHT') {
            throw new Error('Handedness must be LEFT or RIGHT');
        }

        return this.repository.create(data);
    }

    async update(id: string, data: Partial<Omit<Player, 'id'>>): Promise<Player> {
        // Validation: number must be positive if provided
        if (data.number !== undefined && data.number <= 0) {
            throw new Error('Player number must be positive');
        }

        // Validation: handedness must be LEFT or RIGHT if provided
        if (data.handedness && data.handedness !== 'LEFT' && data.handedness !== 'RIGHT') {
            throw new Error('Handedness must be LEFT or RIGHT');
        }

        return this.repository.update(id, data);
    }

    async delete(id: string): Promise<Player> {
        return this.repository.delete(id);
    }
}

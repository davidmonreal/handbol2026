import { Club } from '@prisma/client';
import { IClubRepository } from '../repositories/club-repository';

export class ClubService {
  constructor(private clubRepository: IClubRepository) {}

  async getAllClubs(): Promise<Club[]> {
    return this.clubRepository.findAll();
  }

  async getClubById(id: string): Promise<Club | null> {
    return this.clubRepository.findById(id);
  }

  async createClub(name: string): Promise<Club> {
    return this.clubRepository.create({ name });
  }

  async updateClub(id: string, name: string): Promise<Club> {
    return this.clubRepository.update(id, { name });
  }

  async deleteClub(id: string): Promise<Club> {
    return this.clubRepository.delete(id);
  }
}

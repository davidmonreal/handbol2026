import { Club } from '@prisma/client';
import { BaseService } from './base-service';
import { IClubRepository } from '../repositories/club-repository';

export class ClubService extends BaseService<Club> {
  constructor(repository: IClubRepository) {
    super(repository);
  }

  // Custom methods can be added here if needed
  // Standard CRUD methods are inherited from BaseService
}

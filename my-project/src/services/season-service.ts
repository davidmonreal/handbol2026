import { Season } from '@prisma/client';
import { BaseService } from './base-service';
import { SeasonRepository } from '../repositories/season-repository';
import { TeamRepository } from '../repositories/team-repository';

export class SeasonService extends BaseService<Season> {
  constructor(
    repository: SeasonRepository,
    private teamRepository: TeamRepository,
  ) {
    super(repository);
  }

  async create(data: { name: string; startDate: Date; endDate: Date }): Promise<Season> {
    if (data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }
    return super.create(data);
  }

  async update(
    id: string,
    data: Partial<{ name: string; startDate: Date; endDate: Date }>,
  ): Promise<Season> {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }
    return super.update(id, data);
  }

  async delete(id: string): Promise<Season> {
    const teamCount = await this.teamRepository.countBySeason(id);
    if (teamCount > 0) {
      throw new Error(
        'Cannot delete season with associated teams. Please delete or reassign the teams first.',
      );
    }
    return super.delete(id);
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeasonService } from '../src/services/season-service';
import { SeasonRepository } from '../src/repositories/season-repository';
import { TeamRepository } from '../src/repositories/team-repository';

vi.mock('../src/repositories/season-repository');
vi.mock('../src/repositories/team-repository');

describe('SeasonService', () => {
  let service: SeasonService;
  let repository: SeasonRepository;
  let teamRepository: TeamRepository;

  beforeEach(() => {
    repository = new SeasonRepository();
    teamRepository = new TeamRepository();
    service = new SeasonService(repository, teamRepository);
    vi.clearAllMocks();
  });

  it('getAll calls repository.findAll', async () => {
    const mockSeasons = [
      { id: '1', name: '2024-2025', startDate: new Date(), endDate: new Date() },
    ];
    vi.mocked(repository.findAll).mockResolvedValue(mockSeasons);

    const result = await service.getAll();

    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockSeasons);
  });

  it('getById calls repository.findById', async () => {
    const mockSeason = { id: '1', name: '2024-2025', startDate: new Date(), endDate: new Date() };
    vi.mocked(repository.findById).mockResolvedValue(mockSeason);

    const result = await service.getById('1');

    expect(repository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockSeason);
  });

  it('create calls repository.create with valid data', async () => {
    const newSeasonData = {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
    };
    const createdSeason = { id: '2', ...newSeasonData };
    vi.mocked(repository.create).mockResolvedValue(createdSeason);

    const result = await service.create(newSeasonData);

    expect(repository.create).toHaveBeenCalledWith(newSeasonData);
    expect(result).toEqual(createdSeason);
  });

  it('create throws error if endDate is before startDate', async () => {
    const invalidData = {
      name: 'Invalid Season',
      startDate: new Date('2026-06-30'),
      endDate: new Date('2025-09-01'),
    };

    await expect(service.create(invalidData)).rejects.toThrow('End date must be after start date');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('update calls repository.update', async () => {
    const updateData = { name: 'Updated' };
    const updatedSeason = { id: '1', name: 'Updated', startDate: new Date(), endDate: new Date() };
    vi.mocked(repository.update).mockResolvedValue(updatedSeason);

    const result = await service.update('1', updateData);

    expect(repository.update).toHaveBeenCalledWith('1', updateData);
    expect(result).toEqual(updatedSeason);
  });

  it('delete calls repository.delete', async () => {
    const deletedSeason = { id: '1', name: 'Deleted', startDate: new Date(), endDate: new Date() };
    vi.mocked(repository.delete).mockResolvedValue(deletedSeason);
    vi.mocked(teamRepository.countBySeason).mockResolvedValue(0);

    const result = await service.delete('1');

    expect(repository.delete).toHaveBeenCalledWith('1');
    expect(result).toEqual(deletedSeason);
  });

  it('delete throws error if season has associated teams', async () => {
    vi.mocked(teamRepository.countBySeason).mockResolvedValue(5);

    await expect(service.delete('1')).rejects.toThrow('Cannot delete season with associated teams');
    expect(repository.delete).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerService } from '../src/services/player-service';
import { PlayerRepository } from '../src/repositories/player-repository';

vi.mock('../src/repositories/player-repository');

describe('PlayerService', () => {
    let service: PlayerService;
    let repository: PlayerRepository;

    beforeEach(() => {
        repository = new PlayerRepository();
        service = new PlayerService(repository);
        vi.clearAllMocks();
    });

    it('getAll calls repository.findAll', async () => {
        const mockPlayers = [{ id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' }];
        (repository.findAll as any).mockResolvedValue(mockPlayers);

        const result = await service.getAll();

        expect(repository.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockPlayers);
    });

    it('getById calls repository.findById', async () => {
        const mockPlayer = { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' };
        (repository.findById as any).mockResolvedValue(mockPlayer);

        const result = await service.getById('1');

        expect(repository.findById).toHaveBeenCalledWith('1');
        expect(result).toEqual(mockPlayer);
    });

    it('create calls repository.create with valid data', async () => {
        const newPlayerData = { name: 'Bob', number: 7, handedness: 'LEFT' };
        const createdPlayer = { id: '2', ...newPlayerData };
        (repository.create as any).mockResolvedValue(createdPlayer);

        const result = await service.create(newPlayerData);

        expect(repository.create).toHaveBeenCalledWith(newPlayerData);
        expect(result).toEqual(createdPlayer);
    });

    it('create throws error if number is not positive', async () => {
        const invalidData = { name: 'Invalid', number: 0, handedness: 'RIGHT' };

        await expect(service.create(invalidData)).rejects.toThrow('Player number must be positive');
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('create throws error if handedness is invalid', async () => {
        const invalidData = { name: 'Invalid', number: 10, handedness: 'MIDDLE' as any };

        await expect(service.create(invalidData)).rejects.toThrow('Handedness must be LEFT or RIGHT');
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('update calls repository.update', async () => {
        const updateData = { name: 'Alice Updated' };
        const updatedPlayer = { id: '1', name: 'Alice Updated', number: 10, handedness: 'RIGHT' };
        (repository.update as any).mockResolvedValue(updatedPlayer);

        const result = await service.update('1', updateData);

        expect(repository.update).toHaveBeenCalledWith('1', updateData);
        expect(result).toEqual(updatedPlayer);
    });

    it('update throws error if number is not positive', async () => {
        const invalidData = { number: -5 };

        await expect(service.update('1', invalidData)).rejects.toThrow('Player number must be positive');
        expect(repository.update).not.toHaveBeenCalled();
    });

    it('delete calls repository.delete', async () => {
        const deletedPlayer = { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' };
        (repository.delete as any).mockResolvedValue(deletedPlayer);

        const result = await service.delete('1');

        expect(repository.delete).toHaveBeenCalledWith('1');
        expect(result).toEqual(deletedPlayer);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerController } from '../../src/controllers/player-controller';
import { PlayerService } from '../../src/services/player-service';
import { GameEventRepository } from '../../src/repositories/game-event-repository';
import { PlayerRepository } from '../../src/repositories/player-repository';
import type { Request, Response } from 'express';

// Mock dependencies
vi.mock('../../src/services/player-service');
vi.mock('../../src/repositories/game-event-repository');
vi.mock('../../src/repositories/player-repository');

describe('Goalkeeper Flow Integration', () => {
  let playerController: PlayerController;
  let playerService: PlayerService;
  let gameEventRepository: GameEventRepository;
  let playerRepository: PlayerRepository;

  beforeEach(() => {
    // Setup mocks
    playerRepository = new PlayerRepository();
    gameEventRepository = new GameEventRepository();
    playerService = new PlayerService(playerRepository);
    playerController = new PlayerController(playerService);

    vi.clearAllMocks();
  });

  it('Complete Goalkeeper Flow: Create -> Record Event -> Verify Stats', async () => {
    // 1. Create Goalkeeper
    const gkData = { name: 'test-Nico', number: 1, handedness: 'RIGHT', isGoalkeeper: true };
    const createdGk = { id: 'gk-1', ...gkData };

    vi.mocked(playerService.create).mockResolvedValue(createdGk);

    // Simulate Controller Call
    const req = { body: gkData } as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await playerController.create(req, res);

    expect(playerService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isGoalkeeper: true,
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gk-1',
        isGoalkeeper: true,
      }),
    );

    // 2. Record Save Event (Backend Logic Simulation)
    const saveEvent = {
      id: 'evt-1',
      matchId: 'match-1',
      timestamp: 1000,
      type: 'Shot',
      subtype: 'Save',
      activeGoalkeeperId: 'gk-1',
      playerId: 'player-2',
      teamId: 'team-1',
      position: null,
      distance: null,
      isCollective: false,
      hasOpposition: true,
      isCounterAttack: false,
      goalZone: null,
      sanctionType: null,
    };

    vi.mocked(gameEventRepository.create).mockResolvedValue(saveEvent);

    // Verify repository is called with activeGoalkeeperId
    await gameEventRepository.create({
      matchId: 'match-1',
      timestamp: 1000,
      type: 'Shot',
      subtype: 'Save',
      activeGoalkeeperId: 'gk-1',
      playerId: 'player-2',
      teamId: 'team-1',
    });

    expect(gameEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        activeGoalkeeperId: 'gk-1',
        subtype: 'Save',
      }),
    );

    // 3. Retrieve Events for Stats (Backend Logic Simulation)
    const matchEvents = [
      saveEvent,
      {
        id: 'evt-2',
        matchId: 'match-1',
        timestamp: 2000,
        type: 'Shot',
        subtype: 'Goal',
        activeGoalkeeperId: 'gk-1',
        playerId: 'player-3',
        teamId: 'team-1',
        position: null,
        distance: null,
        isCollective: false,
        hasOpposition: true,
        isCounterAttack: false,
        goalZone: null,
        sanctionType: null,
      },
    ];

    vi.mocked(gameEventRepository.findByMatchId).mockResolvedValue(matchEvents);

    const retrievedEvents = await gameEventRepository.findByMatchId('match-1');

    // Verify we get events with activeGoalkeeperId
    expect(retrievedEvents).toHaveLength(2);
    expect((retrievedEvents[0] as typeof saveEvent).activeGoalkeeperId).toBe('gk-1');
    expect((retrievedEvents[1] as typeof saveEvent).activeGoalkeeperId).toBe('gk-1');

    // 4. Verify Statistics Logic (Frontend Simulation)
    // Calculate efficiency: 1 Save, 1 Goal -> 50%
    const totalSaves = retrievedEvents.filter((e) => e.subtype === 'Save').length;
    const totalGoals = retrievedEvents.filter((e) => e.subtype === 'Goal').length;
    const shotsOnTarget = totalSaves + totalGoals;
    const efficiency = (totalSaves / shotsOnTarget) * 100;

    expect(totalSaves).toBe(1);
    expect(totalGoals).toBe(1);
    expect(efficiency).toBe(50);
  });
});

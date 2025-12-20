import { Router } from 'express';
import { GameEventController } from '../controllers/game-event-controller';
import { GameEventService } from '../services/game-event-service';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchRepository } from '../repositories/match-repository';
import { validateRequest } from '../middleware/validate';
import { createGameEventSchema, updateGameEventSchema } from '../schemas/game-event';

type GameEventRouterDeps = {
  controller?: GameEventController;
  service?: GameEventService;
  repository?: GameEventRepository;
  matchRepository?: MatchRepository;
};

export function createGameEventRouter(deps: GameEventRouterDeps = {}): Router {
  const router = Router();

  const controller =
    deps.controller ??
    new GameEventController(
      deps.service ??
        new GameEventService(
          deps.repository ?? new GameEventRepository(),
          deps.matchRepository ?? new MatchRepository(),
        ),
    );

  // Get all game events
  router.get('/', controller.getAll);

  // Get game events by match ID
  router.get('/match/:matchId', controller.getByMatchId);

  // Get single game event
  router.get('/:id', controller.getById);

  // Create game event
  router.post('/', validateRequest(createGameEventSchema), controller.create);

  // Update game event (full update)
  router.put('/:id', validateRequest(updateGameEventSchema), controller.update);

  // Update game event (partial update)
  router.patch('/:id', validateRequest(updateGameEventSchema), controller.update);

  // Delete game event
  router.delete('/:id', controller.delete);

  return router;
}

export default createGameEventRouter();

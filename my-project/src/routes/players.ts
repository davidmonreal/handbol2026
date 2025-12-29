import { Router } from 'express';
import { PlayerRepository } from '../repositories/player-repository';
import { PlayerService } from '../services/player-service';
import { PlayerController } from '../controllers/player-controller';
import { validateRequest } from '../middleware/validate';
import { createPlayerSchema, updatePlayerSchema } from '../schemas';

type PlayerRouterDeps = {
  controller?: PlayerController;
  service?: PlayerService;
  repository?: PlayerRepository;
};

export function createPlayerRouter(deps: PlayerRouterDeps = {}): Router {
  const router = Router();

  const controller =
    deps.controller ??
    new PlayerController(
      deps.service ?? new PlayerService(deps.repository ?? new PlayerRepository()),
    );

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', validateRequest(createPlayerSchema), controller.create);
  router.put('/:id', validateRequest(updatePlayerSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

export default createPlayerRouter();

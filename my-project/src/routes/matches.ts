import { Router } from 'express';
import { MatchRepository } from '../repositories/match-repository';
import { MatchService } from '../services/match-service';
import { MatchController } from '../controllers/match-controller';
import { validateRequest } from '../middleware/validate';
import { createMatchSchema, updateMatchSchema } from '../schemas/match';

type MatchRouterDeps = {
  controller?: MatchController;
  service?: MatchService;
  repository?: MatchRepository;
};

export function createMatchRouter(deps: MatchRouterDeps = {}): Router {
  const router = Router();

  const controller =
    deps.controller ?? new MatchController(deps.service ?? new MatchService(deps.repository ?? new MatchRepository()));

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', validateRequest(createMatchSchema), controller.create);
  router.put('/:id', validateRequest(updateMatchSchema), controller.update);
  router.patch('/:id', validateRequest(updateMatchSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

export default createMatchRouter();

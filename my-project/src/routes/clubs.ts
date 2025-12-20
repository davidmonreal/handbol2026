import { Router } from 'express';
import { ClubRepository } from '../repositories/club-repository';
import { ClubService } from '../services/club-service';
import { ClubController } from '../controllers/club-controller';

type ClubRouterDeps = {
  controller?: ClubController;
  service?: ClubService;
  repository?: ClubRepository;
};

export function createClubRouter(deps: ClubRouterDeps = {}): Router {
  const router = Router();

  const controller =
    deps.controller ?? new ClubController(deps.service ?? new ClubService(deps.repository ?? new ClubRepository()));

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

export default createClubRouter();

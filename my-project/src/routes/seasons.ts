import { Router } from 'express';
import { SeasonRepository } from '../repositories/season-repository';
import { TeamRepository } from '../repositories/team-repository';
import { SeasonService } from '../services/season-service';
import { SeasonController } from '../controllers/season-controller';

type SeasonRouterDeps = {
  controller?: SeasonController;
  service?: SeasonService;
  seasonRepository?: SeasonRepository;
  teamRepository?: TeamRepository;
};

export function createSeasonRouter(deps: SeasonRouterDeps = {}): Router {
  const router = Router();

  const seasonRepo = deps.seasonRepository ?? new SeasonRepository();
  const teamRepo = deps.teamRepository ?? new TeamRepository();
  const controller =
    deps.controller ??
    new SeasonController(deps.service ?? new SeasonService(seasonRepo, teamRepo));

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

export default createSeasonRouter();

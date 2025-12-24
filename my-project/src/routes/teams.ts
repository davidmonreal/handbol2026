import { Router } from 'express';
import { TeamRepository } from '../repositories/team-repository';
import { TeamService } from '../services/team-service';
import { TeamController } from '../controllers/team-controller';

type TeamRouterDeps = {
  controller?: TeamController;
  service?: TeamService;
  repository?: TeamRepository;
};

export function createTeamRouter(deps: TeamRouterDeps = {}): Router {
  const router = Router();

  const controller =
    deps.controller ??
    new TeamController(deps.service ?? new TeamService(deps.repository ?? new TeamRepository()));

  // Team CRUD
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  // Player management
  router.get('/:id/players', controller.getTeamPlayers);
  router.post('/:id/players', controller.assignPlayer);
  router.patch('/:id/players/:playerId', controller.updatePlayerPosition);
  router.delete('/:id/players/:playerId', controller.unassignPlayer);

  return router;
}

export default createTeamRouter();

import { Router } from 'express';
import { MatchRepository } from '../repositories/match-repository';
import { TeamRepository } from '../repositories/team-repository';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchService } from '../services/match-service';
import { MatchController } from '../controllers/match-controller';
import { validateRequest } from '../middleware/validate';
import {
  createMatchSchema,
  updateMatchSchema,
  previewMatchTeamMigrationSchema,
  applyMatchTeamMigrationSchema,
} from '../schemas';
import { PlayerRepository } from '../repositories/player-repository';

type MatchRouterDeps = {
  controller?: MatchController;
  service?: MatchService;
  matchRepository?: MatchRepository;
  teamRepository?: TeamRepository;
  gameEventRepository?: GameEventRepository;
  playerRepository?: PlayerRepository;
};

export function createMatchRouter(deps: MatchRouterDeps = {}): Router {
  const router = Router();

  const matchRepository = deps.matchRepository ?? new MatchRepository();
  const teamRepository = deps.teamRepository ?? new TeamRepository();
  const gameEventRepository = deps.gameEventRepository ?? new GameEventRepository();
  const playerRepository = deps.playerRepository ?? new PlayerRepository();

  const service =
    deps.service ??
    new MatchService(matchRepository, teamRepository, gameEventRepository, playerRepository);

  const controller = deps.controller ?? new MatchController(service);

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', validateRequest(createMatchSchema), controller.create);
  router.put('/:id', validateRequest(updateMatchSchema), controller.update);
  router.patch('/:id', validateRequest(updateMatchSchema), controller.update);
  router.post(
    '/:id/team-migration/preview',
    validateRequest(previewMatchTeamMigrationSchema),
    controller.previewTeamMigration,
  );
  router.post(
    '/:id/team-migration/apply',
    validateRequest(applyMatchTeamMigrationSchema),
    controller.applyTeamMigration,
  );
  router.delete('/:id', controller.delete);

  return router;
}

export default createMatchRouter();

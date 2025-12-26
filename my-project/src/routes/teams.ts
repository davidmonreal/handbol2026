import { Router } from 'express';
import { TeamRepository } from '../repositories/team-repository';
import { ClubRepository } from '../repositories/club-repository';
import { SeasonRepository } from '../repositories/season-repository';
import { PlayerRepository } from '../repositories/player-repository';
import { TeamService } from '../services/team-service';
import { TeamController } from '../controllers/team-controller';

type TeamRouterDeps = {
  controller?: TeamController;
  service?: TeamService;
  teamRepository?: TeamRepository;
  clubRepository?: ClubRepository;
  seasonRepository?: SeasonRepository;
  playerRepository?: PlayerRepository;
};

export function createTeamRouter(deps: TeamRouterDeps = {}): Router {
  const router = Router();

  const teamRepository = deps.teamRepository ?? new TeamRepository();
  const clubRepository = deps.clubRepository ?? new ClubRepository();
  const seasonRepository = deps.seasonRepository ?? new SeasonRepository();
  const playerRepository = deps.playerRepository ?? new PlayerRepository();

  const service =
    deps.service ??
    new TeamService(teamRepository, clubRepository, seasonRepository, playerRepository);

  const controller = deps.controller ?? new TeamController(service);

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

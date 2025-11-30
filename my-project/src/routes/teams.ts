import { Router } from 'express';
import { TeamRepository } from '../repositories/team-repository';
import { TeamService } from '../services/team-service';
import { TeamController } from '../controllers/team-controller';

const router = Router();
const teamRepository = new TeamRepository();
const teamService = new TeamService(teamRepository);
const teamController = new TeamController(teamService);

// Team CRUD
router.get('/', teamController.getAll);
router.get('/:id', teamController.getById);
router.post('/', teamController.create);
router.put('/:id', teamController.update);
router.delete('/:id', teamController.delete);

// Player management
router.get('/:id/players', teamController.getTeamPlayers);
router.post('/:id/players', teamController.assignPlayer);
router.delete('/:id/players/:playerId', teamController.unassignPlayer);

export default router;

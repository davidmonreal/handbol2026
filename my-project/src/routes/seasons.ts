import { Router } from 'express';
import { SeasonRepository } from '../repositories/season-repository';
import { TeamRepository } from '../repositories/team-repository';
import { SeasonService } from '../services/season-service';
import { SeasonController } from '../controllers/season-controller';

const router = Router();
const seasonRepository = new SeasonRepository();
const teamRepository = new TeamRepository();
const seasonService = new SeasonService(seasonRepository, teamRepository);
const seasonController = new SeasonController(seasonService);

router.get('/', seasonController.getAll);
router.get('/:id', seasonController.getById);
router.post('/', seasonController.create);
router.put('/:id', seasonController.update);
router.delete('/:id', seasonController.delete);

export default router;

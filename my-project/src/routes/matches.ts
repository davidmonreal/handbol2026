import { Router } from 'express';
import { MatchRepository } from '../repositories/match-repository';
import { MatchService } from '../services/match-service';
import { MatchController } from '../controllers/match-controller';

const router = Router();
const matchRepository = new MatchRepository();
const matchService = new MatchService(matchRepository);
const matchController = new MatchController(matchService);

router.get('/', matchController.getAll);
router.get('/:id', matchController.getById);
router.post('/', matchController.create);
router.put('/:id', matchController.update);
router.delete('/:id', matchController.delete);

export default router;

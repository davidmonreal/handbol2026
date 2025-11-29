import { Router } from 'express';
import { PlayerRepository } from '../repositories/player-repository';
import { PlayerService } from '../services/player-service';
import { PlayerController } from '../controllers/player-controller';

const router = Router();
const playerRepository = new PlayerRepository();
const playerService = new PlayerService(playerRepository);
const playerController = new PlayerController(playerService);

router.get('/', playerController.getAll);
router.get('/:id', playerController.getById);
router.post('/', playerController.create);
router.put('/:id', playerController.update);
router.delete('/:id', playerController.delete);

export default router;

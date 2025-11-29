import { Router } from 'express';
import { GameEventController } from '../controllers/game-event-controller';
import { GameEventService } from '../services/game-event-service';
import { GameEventRepository } from '../repositories/game-event-repository';

const router = Router();
const repository = new GameEventRepository();
const service = new GameEventService(repository);
const controller = new GameEventController(service);

// Get all game events
router.get('/', controller.getAll);

// Get game events by match ID
router.get('/match/:matchId', controller.getByMatchId);

// Get single game event
router.get('/:id', controller.getById);

// Create game event
router.post('/', controller.create);

// Update game event
router.put('/:id', controller.update);

// Delete game event
router.delete('/:id', controller.delete);

export default router;

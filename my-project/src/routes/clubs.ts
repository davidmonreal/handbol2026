import { Router } from 'express';
import { ClubRepository } from '../repositories/club-repository';
import { ClubService } from '../services/club-service';
import { ClubController } from '../controllers/club-controller';

const router = Router();
const clubRepository = new ClubRepository();
const clubService = new ClubService(clubRepository);
const clubController = new ClubController(clubService);

router.get('/', clubController.getAll);
router.get('/:id', clubController.getById);
router.post('/', clubController.create);
router.put('/:id', clubController.update);
router.delete('/:id', clubController.delete);

export default router;

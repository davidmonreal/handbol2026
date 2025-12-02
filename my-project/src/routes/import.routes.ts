import express from 'express';
import { importPlayersFromImage } from '../controllers/import.controller';
import { batchCreatePlayers, batchCreateWithTeam } from '../controllers/players.batch.controller';
import { checkDuplicates } from '../controllers/players.duplicates.controller';
import { mergePlayer } from '../controllers/players.merge.controller';

const router = express.Router();

router.post('/import-players-from-image', importPlayersFromImage);
router.post('/players/batch', batchCreatePlayers);
router.post('/players/batch-with-team', batchCreateWithTeam);
router.post('/players/check-duplicates', checkDuplicates);
router.post('/players/merge', mergePlayer);

export default router;

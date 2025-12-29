import express from 'express';
import { importPlayersFromImage } from '../controllers/import.controller';
import { batchCreatePlayers, batchCreateWithTeam } from '../controllers/players.batch.controller';
import { checkDuplicates } from '../controllers/players.duplicates.controller';
import { mergePlayer } from '../controllers/players.merge.controller';
import { validateRequest } from '../middleware/validate';
import { importPlayersImageSchema } from '../schemas';

type ImportRouterDeps = {
  importPlayersFromImage?: typeof importPlayersFromImage;
  batchCreatePlayers?: typeof batchCreatePlayers;
  batchCreateWithTeam?: typeof batchCreateWithTeam;
  checkDuplicates?: typeof checkDuplicates;
  mergePlayer?: typeof mergePlayer;
};

export function createImportRouter(deps: ImportRouterDeps = {}) {
  const router = express.Router();

  router.post(
    '/import-players-from-image',
    validateRequest(importPlayersImageSchema, 'body', {
      fallbackMessage: 'Image data is required',
    }),
    deps.importPlayersFromImage ?? importPlayersFromImage,
  );
  router.post('/players/batch', deps.batchCreatePlayers ?? batchCreatePlayers);
  router.post('/players/batch-with-team', deps.batchCreateWithTeam ?? batchCreateWithTeam);
  router.post('/players/check-duplicates', deps.checkDuplicates ?? checkDuplicates);
  router.post('/players/merge', deps.mergePlayer ?? mergePlayer);

  return router;
}

export default createImportRouter();

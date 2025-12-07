-- AddColumn GameEvent.zone (nullable, for storing canonical zone like '7m' or '6m-LW')
ALTER TABLE "GameEvent" ADD COLUMN "zone" TEXT;

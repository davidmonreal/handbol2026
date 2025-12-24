-- Add player position and remove deprecated role
ALTER TABLE "PlayerTeamSeason" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerTeamSeason" DROP COLUMN IF EXISTS "role";

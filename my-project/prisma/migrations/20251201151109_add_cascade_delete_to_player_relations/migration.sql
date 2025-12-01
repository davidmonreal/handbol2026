-- DropForeignKey
ALTER TABLE "PlayerTeamSeason" DROP CONSTRAINT "PlayerTeamSeason_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerTeamSeason" DROP CONSTRAINT "PlayerTeamSeason_teamId_fkey";

-- AddForeignKey
ALTER TABLE "PlayerTeamSeason" ADD CONSTRAINT "PlayerTeamSeason_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTeamSeason" ADD CONSTRAINT "PlayerTeamSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "GameEvent" ADD COLUMN     "activeGoalkeeperId" TEXT;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_activeGoalkeeperId_fkey" FOREIGN KEY ("activeGoalkeeperId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

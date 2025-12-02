-- CreateEnum
CREATE TYPE "Handedness" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- Step 1: Normalize existing data to uppercase
UPDATE "Player" SET handedness = UPPER(handedness);

-- Step 2: Handle any edge cases (convert any invalid values to default)
-- This ensures only LEFT, RIGHT, or BOTH exist in the data
UPDATE "Player" SET handedness = 'RIGHT' 
WHERE handedness NOT IN ('LEFT', 'RIGHT', 'BOTH');

-- Step 3: AlterTable - Change column type to enum
ALTER TABLE "Player" 
ALTER COLUMN "handedness" DROP DEFAULT,
ALTER COLUMN "handedness" TYPE "Handedness" USING (handedness::"Handedness"),
ALTER COLUMN "handedness" SET DEFAULT 'RIGHT';

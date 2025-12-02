-- Convert any BOTH values to RIGHT
UPDATE "Player" SET handedness = 'RIGHT' WHERE handedness = 'BOTH';

-- Drop default temporarily
ALTER TABLE "Player" ALTER COLUMN "handedness" DROP DEFAULT;

-- Remove BOTH from enum
ALTER TYPE "Handedness" RENAME TO "Handedness_old";
CREATE TYPE "Handedness" AS ENUM ('LEFT', 'RIGHT');
ALTER TABLE "Player" ALTER COLUMN "handedness" TYPE "Handedness" USING (handedness::text::"Handedness");
DROP TYPE "Handedness_old";

-- Re-add default
ALTER TABLE "Player" ALTER COLUMN "handedness" SET DEFAULT 'RIGHT';

-- Move player number from Player to PlayerTeamSeason
ALTER TABLE "PlayerTeamSeason" ADD COLUMN IF NOT EXISTS "number" INTEGER;

UPDATE "PlayerTeamSeason" AS pts
SET "number" = p."number"
FROM "Player" AS p
WHERE pts."playerId" = p."id" AND pts."number" IS NULL;

-- Resolve duplicate numbers within the same team by assigning the next available numbers.
WITH duplicates AS (
  SELECT
    id,
    "teamId",
    "number",
    ROW_NUMBER() OVER (PARTITION BY "teamId", "number" ORDER BY id) AS dup_rank
  FROM "PlayerTeamSeason"
),
duplicate_rows AS (
  SELECT id, "teamId", "number", dup_rank
  FROM duplicates
  WHERE dup_rank > 1
),
available_numbers AS (
  SELECT
    teams."teamId",
    nums.number,
    ROW_NUMBER() OVER (PARTITION BY teams."teamId" ORDER BY nums.number) AS avail_rank
  FROM (SELECT DISTINCT "teamId" FROM "PlayerTeamSeason") AS teams
  CROSS JOIN LATERAL (
    SELECT generate_series(0, 99) AS number
  ) AS nums
  WHERE nums.number NOT IN (
    SELECT DISTINCT "number"
    FROM "PlayerTeamSeason" AS pts
    WHERE pts."teamId" = teams."teamId"
  )
),
assignments AS (
  SELECT dup.id, avail.number AS new_number
  FROM duplicate_rows AS dup
  JOIN available_numbers AS avail
    ON avail."teamId" = dup."teamId"
   AND avail.avail_rank = dup.dup_rank - 1
)
UPDATE "PlayerTeamSeason" AS pts
SET "number" = assignments.new_number
FROM assignments
WHERE pts.id = assignments.id;

ALTER TABLE "PlayerTeamSeason" ALTER COLUMN "number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PlayerTeamSeason_teamId_number_key" ON "PlayerTeamSeason"("teamId", "number");

ALTER TABLE "Player" DROP COLUMN IF EXISTS "number";

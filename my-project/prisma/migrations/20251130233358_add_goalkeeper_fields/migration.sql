-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT NOT NULL,
    "activeGoalkeeperId" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "position" TEXT,
    "distance" TEXT,
    "isCollective" BOOLEAN NOT NULL DEFAULT false,
    "hasOpposition" BOOLEAN NOT NULL DEFAULT true,
    "isCounterAttack" BOOLEAN NOT NULL DEFAULT false,
    "goalZone" TEXT,
    "sanctionType" TEXT,
    CONSTRAINT "GameEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameEvent_activeGoalkeeperId_fkey" FOREIGN KEY ("activeGoalkeeperId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameEvent" ("distance", "goalZone", "hasOpposition", "id", "isCollective", "isCounterAttack", "matchId", "playerId", "position", "sanctionType", "subtype", "teamId", "timestamp", "type") SELECT "distance", "goalZone", "hasOpposition", "id", "isCollective", "isCounterAttack", "matchId", "playerId", "position", "sanctionType", "subtype", "teamId", "timestamp", "type" FROM "GameEvent";
DROP TABLE "GameEvent";
ALTER TABLE "new_GameEvent" RENAME TO "GameEvent";
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "handedness" TEXT NOT NULL DEFAULT 'RIGHT',
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Player" ("handedness", "id", "name", "number") SELECT "handedness", "id", "name", "number" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

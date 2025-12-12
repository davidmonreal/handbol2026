-- Add per-team event lock flags
ALTER TABLE "Match"
ADD COLUMN "homeEventsLocked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Match"
ADD COLUMN "awayEventsLocked" BOOLEAN NOT NULL DEFAULT false;

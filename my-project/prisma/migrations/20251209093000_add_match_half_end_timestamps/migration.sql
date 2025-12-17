-- Add end timestamps for each half
ALTER TABLE "Match"
ADD COLUMN "realTimeFirstHalfEnd" DOUBLE PRECISION;

ALTER TABLE "Match"
ADD COLUMN "realTimeSecondHalfEnd" DOUBLE PRECISION;

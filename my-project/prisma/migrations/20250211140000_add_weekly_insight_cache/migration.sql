-- CreateTable
CREATE TABLE "WeeklyInsightCache" (
    "id" TEXT NOT NULL,
    "rangeStart" TIMESTAMP(3) NOT NULL,
    "rangeEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "WeeklyInsightCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyInsightCache_rangeStart_rangeEnd_key" ON "WeeklyInsightCache"("rangeStart", "rangeEnd");

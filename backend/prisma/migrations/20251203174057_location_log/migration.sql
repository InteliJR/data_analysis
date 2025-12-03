-- AlterTable
ALTER TABLE "raw_material_location_pivots" ADD COLUMN     "priceConvertedBrl" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "location_change_logs" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_change_logs_locationId_idx" ON "location_change_logs"("locationId");

-- CreateIndex
CREATE INDEX "location_change_logs_userId_idx" ON "location_change_logs"("userId");

-- CreateIndex
CREATE INDEX "location_change_logs_changedAt_idx" ON "location_change_logs"("changedAt");

-- AddForeignKey
ALTER TABLE "location_change_logs" ADD CONSTRAINT "location_change_logs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_change_logs" ADD CONSTRAINT "location_change_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

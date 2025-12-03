/*
  Warnings:

  - You are about to drop the column `acquisitionPrice` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the column `additionalCost` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the column `priceConvertedBrl` on the `raw_materials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "raw_materials" DROP COLUMN "acquisitionPrice",
DROP COLUMN "additionalCost",
DROP COLUMN "currency",
DROP COLUMN "priceConvertedBrl";

-- CreateTable
CREATE TABLE "raw_material_locations" (
    "id" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "country" TEXT DEFAULT 'BR',
    "stateUf" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "acquisitionPrice" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "priceConvertedBrl" DECIMAL(12,2) NOT NULL,
    "additionalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_material_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_location_taxes" (
    "id" TEXT NOT NULL,
    "rawMaterialLocationId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "recoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_material_location_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FreightToRawMaterialLocation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FreightToRawMaterialLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "raw_material_locations_rawMaterialId_idx" ON "raw_material_locations"("rawMaterialId");

-- CreateIndex
CREATE INDEX "raw_material_locations_stateUf_city_idx" ON "raw_material_locations"("stateUf", "city");

-- CreateIndex
CREATE INDEX "raw_material_location_taxes_rawMaterialLocationId_idx" ON "raw_material_location_taxes"("rawMaterialLocationId");

-- CreateIndex
CREATE INDEX "raw_material_location_taxes_taxId_idx" ON "raw_material_location_taxes"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_location_taxes_rawMaterialLocationId_taxId_key" ON "raw_material_location_taxes"("rawMaterialLocationId", "taxId");

-- CreateIndex
CREATE INDEX "_FreightToRawMaterialLocation_B_index" ON "_FreightToRawMaterialLocation"("B");

-- AddForeignKey
ALTER TABLE "raw_material_locations" ADD CONSTRAINT "raw_material_locations_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_location_taxes" ADD CONSTRAINT "raw_material_location_taxes_rawMaterialLocationId_fkey" FOREIGN KEY ("rawMaterialLocationId") REFERENCES "raw_material_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_location_taxes" ADD CONSTRAINT "raw_material_location_taxes_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "raw_material_taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterialLocation" ADD CONSTRAINT "_FreightToRawMaterialLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "freights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterialLocation" ADD CONSTRAINT "_FreightToRawMaterialLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "raw_material_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

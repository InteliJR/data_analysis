/*
  Warnings:

  - The primary key for the `_FreightToFreightTax` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_FreightToProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `priceWithTaxesAndFreight` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `rawMaterialLocationId` on the `raw_material_location_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `raw_material_taxes` table. All the data in the column will be lost.
  - You are about to drop the `_FreightToRawMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FreightToRawMaterialLocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RawMaterialToRawMaterialTax` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `raw_material_locations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[A,B]` on the table `_FreightToFreightTax` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_FreightToProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rawMaterialLocationPivotId,taxId]` on the table `raw_material_location_taxes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rawMaterialLocationPivotId` to the `raw_material_location_taxes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defaultRate` to the `raw_material_taxes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_FreightToRawMaterial" DROP CONSTRAINT "_FreightToRawMaterial_A_fkey";

-- DropForeignKey
ALTER TABLE "_FreightToRawMaterial" DROP CONSTRAINT "_FreightToRawMaterial_B_fkey";

-- DropForeignKey
ALTER TABLE "_FreightToRawMaterialLocation" DROP CONSTRAINT "_FreightToRawMaterialLocation_A_fkey";

-- DropForeignKey
ALTER TABLE "_FreightToRawMaterialLocation" DROP CONSTRAINT "_FreightToRawMaterialLocation_B_fkey";

-- DropForeignKey
ALTER TABLE "_RawMaterialToRawMaterialTax" DROP CONSTRAINT "_RawMaterialToRawMaterialTax_A_fkey";

-- DropForeignKey
ALTER TABLE "_RawMaterialToRawMaterialTax" DROP CONSTRAINT "_RawMaterialToRawMaterialTax_B_fkey";

-- DropForeignKey
ALTER TABLE "raw_material_location_taxes" DROP CONSTRAINT "raw_material_location_taxes_rawMaterialLocationId_fkey";

-- DropForeignKey
ALTER TABLE "raw_material_locations" DROP CONSTRAINT "raw_material_locations_rawMaterialId_fkey";

-- DropIndex
DROP INDEX "raw_material_location_taxes_rawMaterialLocationId_idx";

-- DropIndex
DROP INDEX "raw_material_location_taxes_rawMaterialLocationId_taxId_key";

-- AlterTable
ALTER TABLE "_FreightToFreightTax" DROP CONSTRAINT "_FreightToFreightTax_AB_pkey";

-- AlterTable
ALTER TABLE "_FreightToProduct" DROP CONSTRAINT "_FreightToProduct_AB_pkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "priceWithTaxesAndFreight",
ADD COLUMN     "totalCostWithAllFreights" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "raw_material_location_taxes" DROP COLUMN "rawMaterialLocationId",
ADD COLUMN     "rawMaterialLocationPivotId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "raw_material_taxes" DROP COLUMN "rate",
ADD COLUMN     "defaultRate" DECIMAL(5,2) NOT NULL;

-- DropTable
DROP TABLE "_FreightToRawMaterial";

-- DropTable
DROP TABLE "_FreightToRawMaterialLocation";

-- DropTable
DROP TABLE "_RawMaterialToRawMaterialTax";

-- DropTable
DROP TABLE "raw_material_locations";

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT DEFAULT 'BR',
    "stateUf" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_location_pivots" (
    "id" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "acquisitionPrice" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "additionalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_material_location_pivots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FreightToRawMaterialLocationPivot" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "raw_material_location_pivots_rawMaterialId_idx" ON "raw_material_location_pivots"("rawMaterialId");

-- CreateIndex
CREATE INDEX "raw_material_location_pivots_locationId_idx" ON "raw_material_location_pivots"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_location_pivots_rawMaterialId_locationId_key" ON "raw_material_location_pivots"("rawMaterialId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToRawMaterialLocationPivot_AB_unique" ON "_FreightToRawMaterialLocationPivot"("A", "B");

-- CreateIndex
CREATE INDEX "_FreightToRawMaterialLocationPivot_B_index" ON "_FreightToRawMaterialLocationPivot"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToFreightTax_AB_unique" ON "_FreightToFreightTax"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToProduct_AB_unique" ON "_FreightToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "raw_material_location_taxes_rawMaterialLocationPivotId_idx" ON "raw_material_location_taxes"("rawMaterialLocationPivotId");

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_location_taxes_rawMaterialLocationPivotId_taxI_key" ON "raw_material_location_taxes"("rawMaterialLocationPivotId", "taxId");

-- AddForeignKey
ALTER TABLE "raw_material_location_pivots" ADD CONSTRAINT "raw_material_location_pivots_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_location_pivots" ADD CONSTRAINT "raw_material_location_pivots_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_location_taxes" ADD CONSTRAINT "raw_material_location_taxes_rawMaterialLocationPivotId_fkey" FOREIGN KEY ("rawMaterialLocationPivotId") REFERENCES "raw_material_location_pivots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterialLocationPivot" ADD CONSTRAINT "_FreightToRawMaterialLocationPivot_A_fkey" FOREIGN KEY ("A") REFERENCES "freights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterialLocationPivot" ADD CONSTRAINT "_FreightToRawMaterialLocationPivot_B_fkey" FOREIGN KEY ("B") REFERENCES "raw_material_location_pivots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

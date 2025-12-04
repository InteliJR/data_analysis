/*
  Warnings:

  - The primary key for the `product_raw_materials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `rawMaterialLocationPivotId` to the `product_raw_materials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_raw_materials" DROP CONSTRAINT "product_raw_materials_pkey",
ADD COLUMN     "rawMaterialLocationPivotId" TEXT NOT NULL,
ADD CONSTRAINT "product_raw_materials_pkey" PRIMARY KEY ("productId", "rawMaterialLocationPivotId");

-- CreateIndex
CREATE INDEX "product_raw_materials_rawMaterialId_idx" ON "product_raw_materials"("rawMaterialId");

-- CreateIndex
CREATE INDEX "product_raw_materials_rawMaterialLocationPivotId_idx" ON "product_raw_materials"("rawMaterialLocationPivotId");

-- AddForeignKey
ALTER TABLE "product_raw_materials" ADD CONSTRAINT "product_raw_materials_rawMaterialLocationPivotId_fkey" FOREIGN KEY ("rawMaterialLocationPivotId") REFERENCES "raw_material_location_pivots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `freightId` on the `freight_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `changedBy` on the `raw_material_change_logs` table. All the data in the column will be lost.
  - You are about to drop the column `rawMaterialId` on the `raw_material_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `freightId` on the `raw_materials` table. All the data in the column will be lost.
  - Added the required column `userId` to the `raw_material_change_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "freight_taxes" DROP CONSTRAINT "freight_taxes_freightId_fkey";

-- DropForeignKey
ALTER TABLE "raw_material_taxes" DROP CONSTRAINT "raw_material_taxes_rawMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "raw_materials" DROP CONSTRAINT "raw_materials_freightId_fkey";

-- DropIndex
DROP INDEX "freight_taxes_freightId_idx";

-- DropIndex
DROP INDEX "raw_material_taxes_rawMaterialId_idx";

-- DropIndex
DROP INDEX "raw_materials_freightId_idx";

-- AlterTable
ALTER TABLE "freight_taxes" DROP COLUMN "freightId";

-- AlterTable
ALTER TABLE "raw_material_change_logs" DROP COLUMN "changedBy",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "raw_material_taxes" DROP COLUMN "rawMaterialId";

-- AlterTable
ALTER TABLE "raw_materials" DROP COLUMN "freightId";

-- CreateTable
CREATE TABLE "_FreightToFreightTax" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FreightToFreightTax_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FreightToRawMaterial" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FreightToRawMaterial_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FreightToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FreightToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RawMaterialToRawMaterialTax" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RawMaterialToRawMaterialTax_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FreightToFreightTax_B_index" ON "_FreightToFreightTax"("B");

-- CreateIndex
CREATE INDEX "_FreightToRawMaterial_B_index" ON "_FreightToRawMaterial"("B");

-- CreateIndex
CREATE INDEX "_FreightToProduct_B_index" ON "_FreightToProduct"("B");

-- CreateIndex
CREATE INDEX "_RawMaterialToRawMaterialTax_B_index" ON "_RawMaterialToRawMaterialTax"("B");

-- CreateIndex
CREATE INDEX "raw_material_change_logs_userId_idx" ON "raw_material_change_logs"("userId");

-- AddForeignKey
ALTER TABLE "raw_material_change_logs" ADD CONSTRAINT "raw_material_change_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToFreightTax" ADD CONSTRAINT "_FreightToFreightTax_A_fkey" FOREIGN KEY ("A") REFERENCES "freights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToFreightTax" ADD CONSTRAINT "_FreightToFreightTax_B_fkey" FOREIGN KEY ("B") REFERENCES "freight_taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterial" ADD CONSTRAINT "_FreightToRawMaterial_A_fkey" FOREIGN KEY ("A") REFERENCES "freights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToRawMaterial" ADD CONSTRAINT "_FreightToRawMaterial_B_fkey" FOREIGN KEY ("B") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToProduct" ADD CONSTRAINT "_FreightToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "freights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreightToProduct" ADD CONSTRAINT "_FreightToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RawMaterialToRawMaterialTax" ADD CONSTRAINT "_RawMaterialToRawMaterialTax_A_fkey" FOREIGN KEY ("A") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RawMaterialToRawMaterialTax" ADD CONSTRAINT "_RawMaterialToRawMaterialTax_B_fkey" FOREIGN KEY ("B") REFERENCES "raw_material_taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

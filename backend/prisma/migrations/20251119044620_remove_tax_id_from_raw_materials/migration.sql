/*
  Warnings:

  - You are about to drop the column `taxId` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the `tax_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "raw_materials" DROP CONSTRAINT "raw_materials_taxId_fkey";

-- DropForeignKey
ALTER TABLE "tax_items" DROP CONSTRAINT "tax_items_taxId_fkey";

-- DropIndex
DROP INDEX "raw_materials_taxId_idx";

-- AlterTable
ALTER TABLE "raw_materials" DROP COLUMN "taxId";

-- DropTable
DROP TABLE "tax_items";

-- DropTable
DROP TABLE "taxes";

-- CreateTable
CREATE TABLE "raw_material_taxes" (
    "id" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "recoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_material_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_material_taxes_rawMaterialId_idx" ON "raw_material_taxes"("rawMaterialId");

-- AddForeignKey
ALTER TABLE "raw_material_taxes" ADD CONSTRAINT "raw_material_taxes_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

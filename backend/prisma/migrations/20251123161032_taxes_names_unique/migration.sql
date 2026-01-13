/*
  Warnings:

  - The primary key for the `_FreightToFreightTax` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_FreightToProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_FreightToRawMaterial` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_RawMaterialToRawMaterialTax` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_FreightToFreightTax` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_FreightToProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_FreightToRawMaterial` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_RawMaterialToRawMaterialTax` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `freight_taxes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `raw_material_taxes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_FreightToFreightTax" DROP CONSTRAINT "_FreightToFreightTax_AB_pkey";

-- AlterTable
ALTER TABLE "_FreightToProduct" DROP CONSTRAINT "_FreightToProduct_AB_pkey";

-- AlterTable
ALTER TABLE "_FreightToRawMaterial" DROP CONSTRAINT "_FreightToRawMaterial_AB_pkey";

-- AlterTable
ALTER TABLE "_RawMaterialToRawMaterialTax" DROP CONSTRAINT "_RawMaterialToRawMaterialTax_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToFreightTax_AB_unique" ON "_FreightToFreightTax"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToProduct_AB_unique" ON "_FreightToProduct"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_FreightToRawMaterial_AB_unique" ON "_FreightToRawMaterial"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_RawMaterialToRawMaterialTax_AB_unique" ON "_RawMaterialToRawMaterialTax"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "freight_taxes_name_key" ON "freight_taxes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_taxes_name_key" ON "raw_material_taxes"("name");

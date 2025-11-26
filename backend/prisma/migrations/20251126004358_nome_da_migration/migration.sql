-- AlterTable
ALTER TABLE "_FreightToFreightTax" ADD CONSTRAINT "_FreightToFreightTax_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_FreightToFreightTax_AB_unique";

-- AlterTable
ALTER TABLE "_FreightToProduct" ADD CONSTRAINT "_FreightToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_FreightToProduct_AB_unique";

-- AlterTable
ALTER TABLE "_FreightToRawMaterial" ADD CONSTRAINT "_FreightToRawMaterial_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_FreightToRawMaterial_AB_unique";

-- AlterTable
ALTER TABLE "_RawMaterialToRawMaterialTax" ADD CONSTRAINT "_RawMaterialToRawMaterialTax_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RawMaterialToRawMaterialTax_AB_unique";

-- AlterTable
ALTER TABLE "product_groups" ADD COLUMN     "porcentage" INTEGER;

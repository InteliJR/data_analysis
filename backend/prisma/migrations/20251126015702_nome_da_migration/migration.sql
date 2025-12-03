/*
  Warnings:

  - You are about to drop the column `overheadPerUnit` on the `fixed_costs` table. All the data in the column will be lost.
  - You are about to drop the column `salesVolume` on the `fixed_costs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "fixed_costs" DROP COLUMN "overheadPerUnit",
DROP COLUMN "salesVolume";

-- AlterTable
ALTER TABLE "product_groups" ADD COLUMN     "overheadPerUnit" DECIMAL(12,2);

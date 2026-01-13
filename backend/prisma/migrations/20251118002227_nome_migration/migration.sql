/*
  Warnings:

  - You are about to drop the column `additionalCosts` on the `freights` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerm` on the `freights` table. All the data in the column will be lost.
  - Added the required column `cargoType` to the `freights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationCity` to the `freights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationUf` to the `freights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationType` to the `freights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originCity` to the `freights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originUf` to the `freights` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FreightOperationType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- AlterTable
ALTER TABLE "freights" DROP COLUMN "additionalCosts",
DROP COLUMN "paymentTerm",
ADD COLUMN     "cargoType" TEXT NOT NULL,
ADD COLUMN     "destinationCity" TEXT NOT NULL,
ADD COLUMN     "destinationUf" TEXT NOT NULL,
ADD COLUMN     "operationType" "FreightOperationType" NOT NULL,
ADD COLUMN     "originCity" TEXT NOT NULL,
ADD COLUMN     "originUf" TEXT NOT NULL;

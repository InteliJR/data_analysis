-- AlterTable
ALTER TABLE "products" ADD COLUMN     "productGroupId" TEXT;

-- CreateTable
CREATE TABLE "product_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_name_key" ON "product_groups"("name");

-- CreateIndex
CREATE INDEX "product_groups_name_idx" ON "product_groups"("name");

-- CreateIndex
CREATE INDEX "products_productGroupId_idx" ON "products"("productGroupId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

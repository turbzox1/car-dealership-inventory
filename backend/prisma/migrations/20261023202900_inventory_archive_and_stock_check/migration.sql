/*
  Warnings:

  - Added the required column `make` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "make" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Hand-written: Prisma can't express CHECK constraints in the schema.
-- Last line of defence against negative stock, whatever the application does.
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_quantity_non_negative" CHECK ("quantity" >= 0);
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_quantity_positive" CHECK ("quantity" > 0);

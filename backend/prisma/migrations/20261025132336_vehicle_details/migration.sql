-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "seats" INTEGER,
ADD COLUMN     "transmission" TEXT,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "isInstalled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "uninstallAt" TIMESTAMP(3);

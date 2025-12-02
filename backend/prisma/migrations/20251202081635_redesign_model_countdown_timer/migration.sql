/*
  Warnings:

  - You are about to drop the `Countdown` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TimmerType" AS ENUM ('FIXED', 'EVERGREEN');

-- CreateEnum
CREATE TYPE "TimerPosition" AS ENUM ('TOP_BAR', 'BOTTOM_BAR', 'PRODUCT_PAGE', 'CART_PAGE');

-- CreateEnum
CREATE TYPE "TimerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Countdown" DROP CONSTRAINT "Countdown_shopId_fkey";

-- DropTable
DROP TABLE "Countdown";

-- DropEnum
DROP TYPE "CountdownPosition";

-- DropEnum
DROP TYPE "CountdownStatus";

-- CreateTable
CREATE TABLE "CountdownTimer" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default timer',
    "message" TEXT NOT NULL DEFAULT 'Hurry up! Offer ends soon.',
    "type" "TimmerType" NOT NULL DEFAULT 'FIXED',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "evergreenMinutes" INTEGER,
    "position" "TimerPosition" NOT NULL DEFAULT 'TOP_BAR',
    "bgColor" TEXT NOT NULL DEFAULT '#111827',
    "textColor" TEXT NOT NULL DEFAULT '#F9FAFB',
    "status" "TimerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountdownTimer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CountdownTimer" ADD CONSTRAINT "CountdownTimer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

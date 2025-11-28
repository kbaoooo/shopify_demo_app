-- CreateEnum
CREATE TYPE "CountdownStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CountdownPosition" AS ENUM ('TOP_BAR', 'BOTTOM_BAR');

-- CreateTable
CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Countdown" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "CountdownStatus" NOT NULL DEFAULT 'ACTIVE',
    "position" "CountdownPosition" NOT NULL DEFAULT 'TOP_BAR',
    "bgColor" TEXT NOT NULL DEFAULT '#000000',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Countdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");

-- AddForeignKey
ALTER TABLE "Countdown" ADD CONSTRAINT "Countdown_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

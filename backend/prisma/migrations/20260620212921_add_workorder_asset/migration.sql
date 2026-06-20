-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'MASONRY', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('EMERGENCY', 'HIGH', 'ROUTINE');

-- CreateEnum
CREATE TYPE "WOStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('GOOD', 'SERVICE_DUE', 'OVERDUE', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "woNumber" TEXT NOT NULL,
    "unitId" TEXT,
    "buildingId" TEXT NOT NULL,
    "trade" "Trade" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'ROUTINE',
    "description" TEXT NOT NULL,
    "status" "WOStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedCost" DECIMAL(10,3),
    "actualCost" DECIMAL(10,3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Trade" NOT NULL,
    "location" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_woNumber_key" ON "WorkOrder"("woNumber");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

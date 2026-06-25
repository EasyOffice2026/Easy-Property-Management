-- CreateEnum
CREATE TYPE "PettyCashTransactionType" AS ENUM ('REPLENISHMENT', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PettyCashCategory" AS ENUM ('MAINTENANCE', 'SUPPLIES', 'UTILITIES', 'TRANSPORT', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "PettyCashStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PettyCashTransaction" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT,
    "type" "PettyCashTransactionType" NOT NULL,
    "category" "PettyCashCategory" NOT NULL,
    "amount" DECIMAL(10,3) NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" "PettyCashStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

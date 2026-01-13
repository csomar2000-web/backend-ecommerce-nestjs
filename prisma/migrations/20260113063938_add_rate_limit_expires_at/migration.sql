/*
  Warnings:

  - Added the required column `expiresAt` to the `rate_limits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rate_limits" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

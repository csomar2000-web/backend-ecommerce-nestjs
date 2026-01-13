/*
  Warnings:

  - You are about to drop the column `action` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `count` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `windowStart` on the `rate_limits` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `rate_limits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `rate_limits` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING', 'HOME', 'WORK');

-- DropIndex
DROP INDEX "rate_limits_expiresAt_idx";

-- DropIndex
DROP INDEX "rate_limits_identifier_action_windowStart_key";

-- AlterTable
ALTER TABLE "rate_limits" DROP COLUMN "action",
DROP COLUMN "count",
DROP COLUMN "identifier",
DROP COLUMN "windowStart",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "key" TEXT NOT NULL,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_addresses_userId_deletedAt_idx" ON "user_addresses"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "user_addresses_country_idx" ON "user_addresses"("country");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- CreateIndex
CREATE INDEX "rate_limits_key_idx" ON "rate_limits"("key");

-- CreateIndex
CREATE INDEX "rate_limits_blockedUntil_idx" ON "rate_limits"("blockedUntil");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

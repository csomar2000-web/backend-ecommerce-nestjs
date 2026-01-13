/*
  Warnings:

  - You are about to drop the column `attempts` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `rate_limits` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier,action,windowStart]` on the table `rate_limits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `rate_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifier` to the `rate_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windowStart` to the `rate_limits` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "rate_limits_key_idx";

-- DropIndex
DROP INDEX "rate_limits_key_key";

-- AlterTable
ALTER TABLE "rate_limits" DROP COLUMN "attempts",
DROP COLUMN "expiresAt",
DROP COLUMN "key",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "identifier" TEXT NOT NULL,
ADD COLUMN     "windowStart" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "rate_limits_identifier_idx" ON "rate_limits"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_action_windowStart_key" ON "rate_limits"("identifier", "action", "windowStart");

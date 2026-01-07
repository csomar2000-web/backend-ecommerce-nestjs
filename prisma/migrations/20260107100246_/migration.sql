/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `auth_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `auth_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `auth_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPoints` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `marketingConsent` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `membershipTier` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `attempts` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `email_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `convertedToUserId` on the `guest_checkouts` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `guest_checkouts` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `guest_checkouts` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `guest_checkouts` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `mfa_factors` table. All the data in the column will be lost.
  - You are about to drop the column `attempts` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `password_resets` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `isSystem` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `attempts` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `blockedUntil` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `isBlocked` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `limitType` on the `rate_limits` table. All the data in the column will be lost.
  - You are about to drop the column `windowEnd` on the `rate_limits` table. All the data in the column will be lost.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `constraints` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `parentRoleId` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `deviceName` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `invalidatedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `invalidationReason` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `eventAction` on the `user_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `user_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `failureReason` on the `user_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `user_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `user_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `user_role_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `worker_profiles` table. All the data in the column will be lost.
  - You are about to drop the `account_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `business_owners` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mfa_challenges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mfa_recovery_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `token_blacklist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_permission_overrides` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[token]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[convertedUserId]` on the table `guest_checkouts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `password_resets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resource,action]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identifier,action,windowStart]` on the table `rate_limits` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `email_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `password_resets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action` to the `rate_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `rate_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action` to the `user_audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'SECURITY', 'ACCOUNT', 'COMPANY', 'ALERT');

-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'APPLE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MfaType" ADD VALUE 'SMS';
ALTER TYPE "MfaType" ADD VALUE 'EMAIL';

-- DropForeignKey
ALTER TABLE "admin_profiles" DROP CONSTRAINT "admin_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "business_owners" DROP CONSTRAINT "business_owners_userId_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "mfa_challenges" DROP CONSTRAINT "mfa_challenges_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "mfa_challenges" DROP CONSTRAINT "mfa_challenges_userId_fkey";

-- DropForeignKey
ALTER TABLE "mfa_recovery_codes" DROP CONSTRAINT "mfa_recovery_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_parentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "user_permission_overrides_companyId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "user_permission_overrides_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "user_permission_overrides_userId_fkey";

-- DropForeignKey
ALTER TABLE "worker_profiles" DROP CONSTRAINT "worker_profiles_companyId_fkey";

-- DropIndex
DROP INDEX "auth_accounts_provider_providerId_idx";

-- DropIndex
DROP INDEX "companies_status_idx";

-- DropIndex
DROP INDEX "companies_taxId_key";

-- DropIndex
DROP INDEX "customer_profiles_membershipTier_idx";

-- DropIndex
DROP INDEX "email_verifications_tokenHash_idx";

-- DropIndex
DROP INDEX "email_verifications_tokenHash_key";

-- DropIndex
DROP INDEX "guest_checkouts_convertedToUserId_idx";

-- DropIndex
DROP INDEX "guest_checkouts_sessionToken_idx";

-- DropIndex
DROP INDEX "mfa_factors_userId_idx";

-- DropIndex
DROP INDEX "mfa_factors_userId_isEnabled_idx";

-- DropIndex
DROP INDEX "password_resets_tokenHash_idx";

-- DropIndex
DROP INDEX "password_resets_tokenHash_key";

-- DropIndex
DROP INDEX "permissions_action_idx";

-- DropIndex
DROP INDEX "permissions_resource_action_scope_key";

-- DropIndex
DROP INDEX "rate_limits_identifier_limitType_idx";

-- DropIndex
DROP INDEX "rate_limits_identifier_limitType_windowStart_key";

-- DropIndex
DROP INDEX "rate_limits_isBlocked_idx";

-- DropIndex
DROP INDEX "rate_limits_windowEnd_idx";

-- DropIndex
DROP INDEX "role_permissions_permissionId_idx";

-- DropIndex
DROP INDEX "role_permissions_roleId_idx";

-- DropIndex
DROP INDEX "role_permissions_roleId_permissionId_key";

-- DropIndex
DROP INDEX "roles_isActive_idx";

-- DropIndex
DROP INDEX "roles_name_idx";

-- DropIndex
DROP INDEX "roles_parentRoleId_idx";

-- DropIndex
DROP INDEX "sessions_lastActivityAt_idx";

-- DropIndex
DROP INDEX "sessions_userId_isActive_idx";

-- DropIndex
DROP INDEX "user_audit_logs_eventType_idx";

-- DropIndex
DROP INDEX "user_audit_logs_sessionId_idx";

-- DropIndex
DROP INDEX "user_audit_logs_userId_eventType_idx";

-- DropIndex
DROP INDEX "user_role_assignments_userId_idx";

-- DropIndex
DROP INDEX "worker_profiles_companyId_employeeId_key";

-- DropIndex
DROP INDEX "worker_profiles_companyId_idx";

-- DropIndex
DROP INDEX "worker_profiles_isActive_idx";

-- AlterTable
ALTER TABLE "auth_accounts" DROP COLUMN "emailVerified",
DROP COLUMN "isVerified",
DROP COLUMN "metadata",
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "isActive",
DROP COLUMN "isVerified",
DROP COLUMN "registrationNumber",
DROP COLUMN "taxId",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "customer_profiles" DROP COLUMN "loyaltyPoints",
DROP COLUMN "marketingConsent",
DROP COLUMN "membershipTier",
DROP COLUMN "phoneNumber",
DROP COLUMN "preferredLanguage",
ADD COLUMN     "address" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "email_verifications" DROP COLUMN "attempts",
DROP COLUMN "tokenHash",
DROP COLUMN "updatedAt",
DROP COLUMN "verified",
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "guest_checkouts" DROP COLUMN "convertedToUserId",
DROP COLUMN "deviceId",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "convertedUserId" TEXT;

-- AlterTable
ALTER TABLE "mfa_factors" DROP COLUMN "isEnabled",
ADD COLUMN     "backupCodes" JSONB,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "password_resets" DROP COLUMN "attempts",
DROP COLUMN "ipAddress",
DROP COLUMN "tokenHash",
DROP COLUMN "updatedAt",
DROP COLUMN "used",
DROP COLUMN "userAgent",
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "displayName",
DROP COLUMN "isSystem",
DROP COLUMN "scope",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "rate_limits" DROP COLUMN "attempts",
DROP COLUMN "blockedUntil",
DROP COLUMN "ipAddress",
DROP COLUMN "isBlocked",
DROP COLUMN "limitType",
DROP COLUMN "windowEnd",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "constraints",
DROP COLUMN "id",
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId");

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "displayName",
DROP COLUMN "parentRoleId",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "isSystem" SET DEFAULT true;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "deviceId",
DROP COLUMN "deviceName",
DROP COLUMN "invalidatedAt",
DROP COLUMN "invalidationReason",
DROP COLUMN "isActive",
DROP COLUMN "lastActivityAt",
ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ALTER COLUMN "ipAddress" DROP NOT NULL,
ALTER COLUMN "userAgent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_audit_logs" DROP COLUMN "eventAction",
DROP COLUMN "eventType",
DROP COLUMN "failureReason",
DROP COLUMN "resourceType",
DROP COLUMN "sessionId",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "resource" TEXT,
ALTER COLUMN "ipAddress" DROP NOT NULL,
ALTER COLUMN "userAgent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_role_assignments" DROP COLUMN "isActive",
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "worker_profiles" DROP COLUMN "isActive",
ALTER COLUMN "hiredAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "account_links";

-- DropTable
DROP TABLE "admin_profiles";

-- DropTable
DROP TABLE "business_owners";

-- DropTable
DROP TABLE "mfa_challenges";

-- DropTable
DROP TABLE "mfa_recovery_codes";

-- DropTable
DROP TABLE "oauth_states";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "security_events";

-- DropTable
DROP TABLE "token_blacklist";

-- DropTable
DROP TABLE "user_permission_overrides";

-- DropEnum
DROP TYPE "AuditEventType";

-- DropEnum
DROP TYPE "MfaChallengeReason";

-- DropEnum
DROP TYPE "SecurityEventType";

-- DropEnum
DROP TYPE "SecuritySeverity";

-- CreateTable
CREATE TABLE "business_owner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "taxId" TEXT,
    "address" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_owner_profiles_userId_key" ON "business_owner_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "business_owner_profiles_taxId_key" ON "business_owner_profiles"("taxId");

-- CreateIndex
CREATE INDEX "business_owner_profiles_taxId_idx" ON "business_owner_profiles"("taxId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "companies_status_deletedAt_idx" ON "companies"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "customer_profiles_phone_idx" ON "customer_profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_token_idx" ON "email_verifications"("token");

-- CreateIndex
CREATE UNIQUE INDEX "guest_checkouts_convertedUserId_key" ON "guest_checkouts"("convertedUserId");

-- CreateIndex
CREATE INDEX "guest_checkouts_convertedUserId_idx" ON "guest_checkouts"("convertedUserId");

-- CreateIndex
CREATE INDEX "mfa_factors_userId_revokedAt_idx" ON "mfa_factors"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_action_windowStart_key" ON "rate_limits"("identifier", "action", "windowStart");

-- CreateIndex
CREATE INDEX "roles_isSystem_isActive_idx" ON "roles"("isSystem", "isActive");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "user_audit_logs_userId_createdAt_idx" ON "user_audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_audit_logs_action_idx" ON "user_audit_logs"("action");

-- CreateIndex
CREATE INDEX "user_audit_logs_resource_resourceId_idx" ON "user_audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "user_role_assignments_userId_revokedAt_idx" ON "user_role_assignments"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "worker_profiles_companyId_terminatedAt_idx" ON "worker_profiles"("companyId", "terminatedAt");

-- CreateIndex
CREATE INDEX "worker_profiles_employeeId_idx" ON "worker_profiles"("employeeId");

-- AddForeignKey
ALTER TABLE "business_owner_profiles" ADD CONSTRAINT "business_owner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "business_owner_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

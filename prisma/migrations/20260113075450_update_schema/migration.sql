/*
  Warnings:

  - You are about to drop the column `address` on the `business_owner_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `business_owner_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `line1` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `line2` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `worker_profiles` table. All the data in the column will be lost.
  - You are about to drop the `MfaFactor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[registrationNumber,countryOfIncorporation]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,addressId,type]` on the table `user_addresses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `countryOfIncorporation` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legalName` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredAddressId` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrationNumber` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressId` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'ADMIN', 'WORKER', 'BUSINESS_OWNER');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CompanyLegalStatus" AS ENUM ('ACTIVE', 'DISSOLVED', 'LIQUIDATION', 'BANKRUPTCY', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "MfaFactor" DROP CONSTRAINT "MfaFactor_userId_fkey";

-- DropForeignKey
ALTER TABLE "worker_profiles" DROP CONSTRAINT "worker_profiles_companyId_fkey";

-- DropIndex
DROP INDEX "business_owner_profiles_taxId_idx";

-- DropIndex
DROP INDEX "business_owner_profiles_taxId_key";

-- DropIndex
DROP INDEX "customer_profiles_phone_idx";

-- DropIndex
DROP INDEX "user_addresses_country_idx";

-- DropIndex
DROP INDEX "worker_profiles_companyId_terminatedAt_idx";

-- AlterTable
ALTER TABLE "business_owner_profiles" DROP COLUMN "address",
DROP COLUMN "taxId",
ADD COLUMN     "businessEmailEncrypted" TEXT,
ADD COLUMN     "businessEmailIv" TEXT,
ADD COLUMN     "businessEmailTag" TEXT,
ADD COLUMN     "businessPhoneEncrypted" TEXT,
ADD COLUMN     "businessPhoneIv" TEXT,
ADD COLUMN     "businessPhoneTag" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "kycCompletedAt" TIMESTAMP(3),
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "primaryAddressId" TEXT,
ADD COLUMN     "taxIdEncrypted" TEXT,
ADD COLUMN     "taxIdIv" TEXT,
ADD COLUMN     "taxIdTag" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "businessLicenseUrl" TEXT,
ADD COLUMN     "countryOfIncorporation" TEXT NOT NULL,
ADD COLUMN     "documentVerificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "incorporationDate" TIMESTAMP(3),
ADD COLUMN     "incorporationDocUrl" TEXT,
ADD COLUMN     "legalName" TEXT NOT NULL,
ADD COLUMN     "legalRepresentativeEncrypted" TEXT,
ADD COLUMN     "legalRepresentativeIv" TEXT,
ADD COLUMN     "legalRepresentativeTag" TEXT,
ADD COLUMN     "legalStatus" "CompanyLegalStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "otherDocumentsUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "registeredAddressId" TEXT NOT NULL,
ADD COLUMN     "registrationNumber" TEXT NOT NULL,
ADD COLUMN     "taxCertificateUrl" TEXT,
ADD COLUMN     "taxIdEncrypted" TEXT,
ADD COLUMN     "taxIdIv" TEXT,
ADD COLUMN     "taxIdTag" TEXT;

-- AlterTable
ALTER TABLE "customer_profiles" DROP COLUMN "address",
DROP COLUMN "birthDate",
DROP COLUMN "phone",
ADD COLUMN     "birthDateEncrypted" TEXT,
ADD COLUMN     "birthDateIv" TEXT,
ADD COLUMN     "birthDateTag" TEXT,
ADD COLUMN     "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneEncrypted" TEXT,
ADD COLUMN     "phoneIv" TEXT,
ADD COLUMN     "phoneTag" TEXT,
ADD COLUMN     "primaryAddressId" TEXT;

-- AlterTable
ALTER TABLE "guest_checkouts" ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "orderIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "shippingAddress" JSONB;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "userType" "UserType";

-- AlterTable
ALTER TABLE "user_addresses" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "isDefault",
DROP COLUMN "line1",
DROP COLUMN "line2",
DROP COLUMN "postalCode",
DROP COLUMN "state",
DROP COLUMN "verifiedAt",
ADD COLUMN     "addressId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "worker_profiles" DROP COLUMN "companyId",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "MfaFactor";

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "addressType" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_verification_audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "previousStatus" "CompanyStatus" NOT NULL,
    "newStatus" "CompanyStatus" NOT NULL,
    "notes" TEXT,
    "documentsChecked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_verification_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_verification_audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "previousStatus" "DocumentVerificationStatus" NOT NULL,
    "newStatus" "DocumentVerificationStatus" NOT NULL,
    "rejectionReason" TEXT,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_verification_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_factors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaType" NOT NULL,
    "secretCipher" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_country_idx" ON "addresses"("country");

-- CreateIndex
CREATE INDEX "addresses_postalCode_idx" ON "addresses"("postalCode");

-- CreateIndex
CREATE INDEX "addresses_deletedAt_idx" ON "addresses"("deletedAt");

-- CreateIndex
CREATE INDEX "company_verification_audits_companyId_idx" ON "company_verification_audits"("companyId");

-- CreateIndex
CREATE INDEX "company_verification_audits_verifiedById_idx" ON "company_verification_audits"("verifiedById");

-- CreateIndex
CREATE INDEX "company_verification_audits_createdAt_idx" ON "company_verification_audits"("createdAt");

-- CreateIndex
CREATE INDEX "document_verification_audits_companyId_idx" ON "document_verification_audits"("companyId");

-- CreateIndex
CREATE INDEX "document_verification_audits_verifiedById_idx" ON "document_verification_audits"("verifiedById");

-- CreateIndex
CREATE INDEX "document_verification_audits_documentType_idx" ON "document_verification_audits"("documentType");

-- CreateIndex
CREATE INDEX "document_verification_audits_createdAt_idx" ON "document_verification_audits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_factors_userId_type_key" ON "mfa_factors"("userId", "type");

-- CreateIndex
CREATE INDEX "business_owner_profiles_businessType_idx" ON "business_owner_profiles"("businessType");

-- CreateIndex
CREATE INDEX "business_owner_profiles_kycStatus_idx" ON "business_owner_profiles"("kycStatus");

-- CreateIndex
CREATE INDEX "business_owner_profiles_deletedAt_idx" ON "business_owner_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "companies_registrationNumber_idx" ON "companies"("registrationNumber");

-- CreateIndex
CREATE INDEX "companies_countryOfIncorporation_idx" ON "companies"("countryOfIncorporation");

-- CreateIndex
CREATE INDEX "companies_legalStatus_idx" ON "companies"("legalStatus");

-- CreateIndex
CREATE INDEX "companies_documentVerificationStatus_idx" ON "companies"("documentVerificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "companies_registrationNumber_countryOfIncorporation_key" ON "companies"("registrationNumber", "countryOfIncorporation");

-- CreateIndex
CREATE INDEX "customer_profiles_deletedAt_idx" ON "customer_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "guest_checkouts_sessionToken_idx" ON "guest_checkouts"("sessionToken");

-- CreateIndex
CREATE INDEX "roles_userType_idx" ON "roles"("userType");

-- CreateIndex
CREATE UNIQUE INDEX "user_addresses_userId_addressId_type_key" ON "user_addresses"("userId", "addressId", "type");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- CreateIndex
CREATE INDEX "users_userType_deletedAt_idx" ON "users"("userType", "deletedAt");

-- CreateIndex
CREATE INDEX "worker_profiles_terminatedAt_idx" ON "worker_profiles"("terminatedAt");

-- CreateIndex
CREATE INDEX "worker_profiles_deletedAt_idx" ON "worker_profiles"("deletedAt");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_primaryAddressId_fkey" FOREIGN KEY ("primaryAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_owner_profiles" ADD CONSTRAINT "business_owner_profiles_primaryAddressId_fkey" FOREIGN KEY ("primaryAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_registeredAddressId_fkey" FOREIGN KEY ("registeredAddressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_verification_audits" ADD CONSTRAINT "company_verification_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_verification_audits" ADD CONSTRAINT "company_verification_audits_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verification_audits" ADD CONSTRAINT "document_verification_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verification_audits" ADD CONSTRAINT "document_verification_audits_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

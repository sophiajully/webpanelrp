-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOL NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN     "twoFactorSecret" STRING;

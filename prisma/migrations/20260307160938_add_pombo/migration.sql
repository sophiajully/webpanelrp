/*
  Warnings:

  - A unique constraint covering the columns `[pombo]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pombo" STRING;

-- CreateIndex
CREATE UNIQUE INDEX "User_pombo_key" ON "User"("pombo");

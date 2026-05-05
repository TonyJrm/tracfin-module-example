/*
  Warnings:

  - You are about to alter the column `remarks` on the `requisitions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Made the column `remarks` on table `requisitions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "requisitions" ALTER COLUMN "remarks" SET NOT NULL,
ALTER COLUMN "remarks" SET DATA TYPE VARCHAR(255);

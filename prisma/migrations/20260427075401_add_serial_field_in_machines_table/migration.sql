/*
  Warnings:

  - A unique constraint covering the columns `[serial_number]` on the table `machines` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serial_number` to the `machines` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add as nullable first so existing rows can be backfilled
ALTER TABLE "machines" ADD COLUMN "serial_number" VARCHAR(10);

-- Backfill existing rows with machine_number as temporary serial_number
UPDATE "machines" SET "serial_number" = "machine_number" WHERE "serial_number" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "machines" ALTER COLUMN "serial_number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "machines_serial_number_key" ON "machines"("serial_number");

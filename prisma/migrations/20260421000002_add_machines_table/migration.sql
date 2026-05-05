-- CreateTable machines
CREATE TABLE "machines" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "machine_number" VARCHAR(10) NOT NULL,
    "machine_type" VARCHAR(50) NOT NULL DEFAULT 'SLOT',
    "denomination" DECIMAL(6,2) NOT NULL DEFAULT 0.01,
    "location_zone" VARCHAR(50) NOT NULL DEFAULT 'ZONE_A',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machines_machine_number_key" ON "machines"("machine_number");

-- CreateIndex
CREATE INDEX "idx_machines_number" ON "machines"("machine_number");

-- CreateIndex
CREATE INDEX "idx_machines_zone" ON "machines"("location_zone");

-- AlterTable: fix machine_number column type in game_sessions (was VARCHAR(50))
ALTER TABLE "game_sessions" ALTER COLUMN "machine_number" TYPE VARCHAR(10);

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_machine_number_fkey" FOREIGN KEY ("machine_number") REFERENCES "machines"("machine_number") ON DELETE NO ACTION ON UPDATE NO ACTION;

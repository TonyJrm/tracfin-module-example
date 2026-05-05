-- CreateTable
CREATE TABLE "requisitions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requested_lastname" VARCHAR(255) NOT NULL,
    "requested_firstname" VARCHAR(255) NOT NULL,
    "requested_birth_date" DATE NOT NULL,
    "added_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "found_at" TIMESTAMP(6),
    "found_client_id" UUID,
    "remarks" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_areas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensitive_areas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_found_client_id_fkey" FOREIGN KEY ("found_client_id") REFERENCES "players"("client_id") ON DELETE SET NULL ON UPDATE NO ACTION;

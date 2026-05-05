-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client_id" UUID NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "account_number" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client_id" UUID NOT NULL,
    "gamedate" TIMESTAMP(6) NOT NULL,
    "flow_datetime" TIMESTAMP(6) NOT NULL,
    "place" VARCHAR(100) NOT NULL,
    "buy" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sell" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transaction" VARCHAR(50) NOT NULL,
    "subtransaction" VARCHAR(50) NOT NULL,
    "is_jackpot" BOOLEAN,
    "is_taxable" BOOLEAN,
    "amount_before_tax" DECIMAL(12,2),
    "tax_amount" DECIMAL(12,2),
    "amount_after_tax" DECIMAL(12,2),
    "value" DECIMAL(12,2),
    "cheque_number" VARCHAR(100),
    "account_number" VARCHAR(100),
    "bank_name" VARCHAR(255),
    "is_guarranteed" BOOLEAN,
    "guarantee_number" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casinos" (
    "casino_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casinos_pkey" PRIMARY KEY ("casino_id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client_id" UUID,
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6) NOT NULL,
    "machine_number" VARCHAR(50) NOT NULL,
    "bills" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "coin_in" DECIMAL(12,2) NOT NULL,
    "cash_out" DECIMAL(12,2) NOT NULL,
    "jackpot" DECIMAL(12,2) DEFAULT 0,
    "out_type" VARCHAR(20) NOT NULL,
    "has_stacker_alert" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "client_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "parent_casino_id" UUID NOT NULL,
    "picture_url" TEXT,
    "gender" VARCHAR(50) NOT NULL,
    "firstname" VARCHAR(255) NOT NULL,
    "lastname" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "birth_place" VARCHAR(255) NOT NULL,
    "nationality" VARCHAR(100) NOT NULL,
    "profession" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(50) NOT NULL,
    "address_number" VARCHAR(50) NOT NULL,
    "address_street" TEXT NOT NULL,
    "address_postal_code" VARCHAR(20),
    "address_city" VARCHAR(255) NOT NULL,
    "address_country" VARCHAR(100) NOT NULL,
    "id_doc_type" VARCHAR(50) NOT NULL,
    "id_doc_number" VARCHAR(100) NOT NULL,
    "id_doc_delivery_date" DATE NOT NULL,
    "id_doc_delivery_place" VARCHAR(255) NOT NULL,
    "id_doc_delivery_dept" VARCHAR(100) NOT NULL,
    "id_doc_expiring_date" DATE NOT NULL,
    "id_doc_country" VARCHAR(100) NOT NULL,
    "comments" TEXT,
    "is_anpr" BOOLEAN DEFAULT false,
    "is_im" BOOLEAN DEFAULT false,
    "loyalty_points" DECIMAL(12,2) DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "tito_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "game_session_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "ticket_number" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "issuance_status" VARCHAR(20) NOT NULL,
    "redemption_status" VARCHAR(20) NOT NULL,
    "issuance_device" VARCHAR(50) NOT NULL,
    "redemption_device" VARCHAR(50) NOT NULL,
    "issuance_time" TIMESTAMP(6) NOT NULL,
    "redemption_time" TIMESTAMP(6),
    "type" VARCHAR(50) NOT NULL,
    "issuance_serial_number" VARCHAR(100) NOT NULL,
    "redemption_serial_number" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tito_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_banks_account" ON "banks"("account_number");

-- CreateIndex
CREATE INDEX "idx_banks_client" ON "banks"("client_id");

-- CreateIndex
CREATE INDEX "idx_cash_trans_client" ON "cash_transactions"("client_id");

-- CreateIndex
CREATE INDEX "idx_cash_trans_flow_datetime" ON "cash_transactions"("flow_datetime");

-- CreateIndex
CREATE INDEX "idx_cash_trans_gamedate" ON "cash_transactions"("gamedate");

-- CreateIndex
CREATE INDEX "idx_cash_trans_type" ON "cash_transactions"("transaction");

-- CreateIndex
CREATE INDEX "idx_casinos_name" ON "casinos"("name");

-- CreateIndex
CREATE INDEX "idx_game_sessions_client" ON "game_sessions"("client_id");

-- CreateIndex
CREATE INDEX "idx_game_sessions_machine" ON "game_sessions"("machine_number");

-- CreateIndex
CREATE INDEX "idx_game_sessions_start_time" ON "game_sessions"("start_time");

-- CreateIndex
CREATE INDEX "idx_players_anpr" ON "players"("is_anpr") WHERE (is_anpr = true);

-- CreateIndex
CREATE INDEX "idx_players_casino" ON "players"("parent_casino_id");

-- CreateIndex
CREATE INDEX "idx_players_email" ON "players"("email");

-- CreateIndex
CREATE INDEX "idx_players_im" ON "players"("is_im") WHERE (is_im = true);

-- CreateIndex
CREATE INDEX "idx_players_lastname" ON "players"("lastname");

-- CreateIndex
CREATE INDEX "idx_tito_client" ON "tito_transactions"("client_id");

-- CreateIndex
CREATE INDEX "idx_tito_game_session" ON "tito_transactions"("game_session_id");

-- CreateIndex
CREATE INDEX "idx_tito_issuance_time" ON "tito_transactions"("issuance_time");

-- CreateIndex
CREATE INDEX "idx_tito_ticket" ON "tito_transactions"("ticket_number");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "players"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "players"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "players"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_parent_casino_id_fkey" FOREIGN KEY ("parent_casino_id") REFERENCES "casinos"("casino_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tito_transactions" ADD CONSTRAINT "tito_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "players"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tito_transactions" ADD CONSTRAINT "tito_transactions_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

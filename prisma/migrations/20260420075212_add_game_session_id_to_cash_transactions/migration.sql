-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "game_session_id" UUID;

-- CreateIndex
CREATE INDEX "idx_cash_trans_game_session" ON "cash_transactions"("game_session_id");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

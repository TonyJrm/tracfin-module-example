-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN "related_txn_id" UUID;

-- CreateIndex
CREATE INDEX "idx_cash_trans_related_txn" ON "cash_transactions"("related_txn_id");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_related_txn_id_fkey" FOREIGN KEY ("related_txn_id") REFERENCES "cash_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Rename is_guarranteed to is_guaranteed (fix typo: double r)
ALTER TABLE "cash_transactions" RENAME COLUMN "is_guarranteed" TO "is_guaranteed";

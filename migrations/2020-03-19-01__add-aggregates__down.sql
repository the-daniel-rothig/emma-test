DROP FUNCTION "Transactions_report";

DROP TRIGGER "Transactions_amount_agg_trigger" ON "Transactions";
DROP FUNCTION "Transactions_amount_agg_trigger_function";
DROP INDEX "Transactions_user_id_merchant_id_amount_agg_idx";
ALTER TABLE "Transactions" DROP COLUMN amount_agg;
DROP INDEX "Transactions_user_id_merchant_id_date_idx";
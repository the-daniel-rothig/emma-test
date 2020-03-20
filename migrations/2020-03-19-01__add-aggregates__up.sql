CREATE INDEX "Transactions_user_id_merchant_id_date_idx" ON "Transactions" (user_id, merchant_id, date);

ALTER TABLE "Transactions" 
ADD COLUMN amount_agg MONEY;

CREATE INDEX "Transactions_user_id_merchant_id_amount_agg_idx" ON "Transactions" (user_id, merchant_id, amount_agg);

CREATE OR REPLACE FUNCTION "Transactions_amount_agg_trigger_function"() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
   BEGIN
      NEW.amount_agg := (SELECT NEW.amount + COALESCE(amount_agg, 0::money)
        FROM generate_series(1,1)
        LEFT JOIN "Transactions" as t2
        ON t2.user_id = NEW.user_id
        AND t2.merchant_id = NEW.merchant_id
        ORDER BY date DESC
        LIMIT 1);
        
      RETURN NEW;
   END;
$$;

CREATE TRIGGER "Transactions_amount_agg_trigger" 
BEFORE INSERT ON "Transactions"
FOR EACH ROW
EXECUTE PROCEDURE "Transactions_amount_agg_trigger_function"();

CREATE OR REPLACE FUNCTION "Transactions_report" (p_from timestamp, p_to timestamp)
RETURNS TABLE (
  user_id int,
  merchant_id int,
  percentile float
)
LANGUAGE SQL
AS $$
  WITH t_high AS (
    SELECT merchant_id,
           user_id,
           amount_agg,
           ROW_NUMBER() OVER (PARTITION BY user_id, merchant_id ORDER BY amount_agg desc) row_no
    FROM "Transactions" 
    WHERE date < p_to
  ), t_low AS (
    SELECT merchant_id,
           user_id,
           amount_agg,
           ROW_NUMBER() OVER (PARTITION BY user_id, merchant_id ORDER BY amount_agg desc) row_no
    FROM "Transactions" 
    WHERE date < p_from
  )
  SELECT  t_high.user_id,
          t_high.merchant_id,
          CUME_DIST() OVER (PARTITION BY t_high.merchant_id ORDER BY t_high.amount_agg - COALESCE(t_low.amount_agg, 0::money) asc) percentile
  FROM t_high
  LEFT JOIN t_low 
  ON t_high.merchant_id = t_low.merchant_id
    AND t_high.user_id = t_low.user_id
    AND t_low.row_no = 1
  WHERE t_high.row_no = 1
$$;

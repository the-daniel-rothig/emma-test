CREATE TABLE "Transactions" (
  id SERIAL,
  user_id INT,
  merchant_id INT,
  date timestamp,
  amount money
);

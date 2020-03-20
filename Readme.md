# emma-test

A quick demo for aggregate reports over a set of transactions.

## Run

1. run `npm install`
2. update the connection details in `.env` to connect to an empty database
3. run `migrations/1970-01-01-01__assumed_schema__up.sql` and then `migrations/2020-03-19-01__add-aggregates__up.sql` against that database.
4. run `npm start`
5. navigate eg. to `http://localhost:8080/percentiles?from=2000-01-01&to=2000-01-02&userId=1` to see the data.

To seed your database with some test data, you can use the following script:

```sql
  INSERT INTO "Transactions"(user_id, merchant_id, date, amount)
  SELECT u.a as user_id,
          m.a as merchant_id,
          '2000-01-01'::timestamp + ((10000000 * random())::int || ' milliseconds')::interval as date,
          (1000 * random() + 1)::numeric::money as amount
  FROM generate_series(0, 999) AS u(a)
  JOIN generate_series(0, 499) as m(a) ON 1=1
```

## Test

1. run `npm install`
2. update the connection details in `.env` to connect to an empty database
3. run `npm test`

## Discussion: approach

This solution calculates the percentile of a user's spending for a given merchant as the spend ranking divided by the customers for this merchant.

Calculcting this rank requires processing of all users, so limiting the result set to a single user does not reduce the computational cost, O( U * M );

However, to ensure that not every single transaction needs to be processed, the aggregate spend per user per merchant is tallied for each transactions, meaning that the total spend of a user at a merchant can be determined retrieving only two rows: the last transaction total inside the query window, and the last transaction total prior to the query window (or 0 if there are no prior transactions). This helps the query scale to large time windows.

A key assumption of this approach is that transaction inserts are sufficiently evenly distributed that guarding them with a trigger does not lead to contention.

A more scalable version of this would make statistical assumptions over the customer distribution (modelling it as a Gamma distribution). This would reduce the single-user lookup to a comparison against the Cumulative Distribution of the Gamma function for each merchant. Should the data not readily fit to a distribution in real life, letting users compare themselves against cached histograms for fixed time widows would be a pragmatic workaround. All these options assume that the percentile has illustrative purposes and need not be highly accurate. 

## Discussion: code structure

Most of the logic is kept in the SQL schema to minimise the number of rows that need to be processed and transmitted. Access to the new "Transmission_report" Table-Valued Function is wrapped by the `Database` class on the node side. Query parameter validation is orchestrated via the route handler (we're using express here).

This separation of concern led to good testability.

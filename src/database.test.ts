import dotenv from 'dotenv';
import { Database } from './database';
import { Pool } from 'pg';
import fs from 'fs';

dotenv.config();

const migrations_up = [
  fs.readFileSync('migrations/1970-01-01-01__assumed_schema__up.sql', 'utf8'),
  fs.readFileSync('migrations/2020-03-19-01__add-aggregates__up.sql', 'utf8')
] 
const migrations_down = [
  fs.readFileSync('migrations/2020-03-19-01__add-aggregates__down.sql', 'utf8'),
  fs.readFileSync('migrations/1970-01-01-01__assumed_schema__down.sql', 'utf8')
]

const dayOne = '2000-01-01', dayTwo = '2000-01-02', dayThree = '2000-01-03';

describe('database', () => {
  let pool : Pool;
  let db : Database;

  beforeAll(async () => {
    pool = new Pool({
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '')
    });
    
    try {
      for (var i = 0; i < migrations_down.length; i++) {
        await pool.query(migrations_down[i]);
      }
    } catch (e) {
      
    }
  })

  beforeEach(async () => {
    for (var i = 0; i < migrations_up.length; i++) {
      await pool.query(migrations_up[i]);
    }
    db = new Database();
  })

  afterEach(async () => {
    for (var i = 0; i < migrations_down.length; i++) {
      await pool.query(migrations_down[i]);
    }
    await db.end();
  })

  afterAll(async () => {
    await pool.end();
  })

  it('builds a schema successfully', () => {
    // tests beforeEach and afterEach
  });

  it('queries the correct time slices', async () => {
    await pool.query(`
    INSERT INTO "Transactions" (user_id, merchant_id, date, amount) VALUES 
      (0,0,$1,10000000),
      (1,0,$1,10),
      (0,0,$2,10),
      (1,0,$2,10000000);
    `, [dayOne, dayTwo]);

    expect([
      await db.getReportsForAllUsers(dayOne, dayTwo),
      await db.getReportsForAllUsers(dayTwo, dayThree),
      await db.getReportsForAllUsers(dayOne, dayThree)
    ]).toMatchSnapshot();
  });

  it('allows filtering down to an individual user', async () => {
    await pool.query(`
    INSERT INTO "Transactions" (user_id, merchant_id, date, amount) VALUES 
      (0,0,$1,10000000),
      (1,0,$1,10),
      (0,0,$2,10),
      (1,0,$2,10000000);
    `, [dayOne, dayTwo]);

    const one = await db.getReportsForUser(0, dayOne, dayTwo);
    const two = await db.getReportsForUser(0, dayTwo, dayThree);

    expect(one.items.length).toBe(1);
    expect(one.items[0].percentile).toBe(1);
    expect(two.items.length).toBe(1);
    expect(two.items[0].percentile).toBe(0.5);
  })

  it('supports paging (getReportsForUser)', async () => {
    await pool.query(`
    INSERT INTO "Transactions"(user_id, merchant_id, date, amount)
    SELECT 0 as user_id,
           s.a as merchant_id,
           $1 as date,
           100::money * s.a as amount
    FROM generate_series(0, 149) AS s(a)
    `, [dayOne])

    const one = await db.getReportsForUser(0, dayOne, dayTwo);
    const two = await db.getReportsForUser(0, dayOne, dayTwo, 1);

    expect(one.items.length).toBe(100);
    expect(one.isEnd).toBe(false);

    expect(two.items.length).toBe(50);
    expect(two.isEnd).toBe(true);
  })

  
  it('supports paging (getReportsForAllUsers)', async () => {
    const dayOne = '2000-01-01';

    await pool.query(`
    INSERT INTO "Transactions"(user_id, merchant_id, date, amount)
    SELECT 0 as user_id,
           s.a as merchant_id,
           $1 as date,
           100::money * s.a as amount
    FROM generate_series(0, 149) AS s(a)
    `, [dayOne])

    const one = await db.getReportsForAllUsers(dayOne, dayTwo);
    const two = await db.getReportsForAllUsers(dayOne, dayTwo, 1);

    expect(one.items.length).toBe(100);
    expect(one.isEnd).toBe(false);

    expect(two.items.length).toBe(50);
    expect(two.isEnd).toBe(true);
  })

  it('works acceptably with big data', async () => {
    const dayOne = '2000-01-01';

    await pool.query(`
    INSERT INTO "Transactions"(user_id, merchant_id, date, amount)
    SELECT u.a as user_id,
           m.a as merchant_id,
           $1::timestamp + ((10000000 * random())::int || ' milliseconds')::interval as date,
           (1000 * random() + 1)::numeric::money as amount
    FROM generate_series(0, 999) AS u(a)
    JOIN generate_series(0, 499) as m(a) ON 1=1
    `, [dayOne])

    console.log('finished data');

    const ts1 = new Date().getTime();
    
    await db.getReportsForUser(0, dayOne, dayTwo);

    const ts2 = new Date().getTime();

    await db.getReportsForAllUsers(dayOne, dayTwo);

    const ts3 = new Date().getTime();

    const seconds1 = (ts2-ts1)/1000;
    const seconds2 = (ts3-ts2)/1000;

    expect(seconds1).toBeLessThan(5);
    expect(seconds2).toBeLessThan(5);
  }, 60 * 1000);
})
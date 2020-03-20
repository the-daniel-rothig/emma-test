import { Pool } from "pg";

export type MerchantPercentile = {
  user_id: number,
  merchant_id: number,
  percentile: number
};

const pageSize = 100;

export class ResultSet<T> {
  readonly items: T[];
  readonly page: number;
  readonly isEnd: boolean;
  
  constructor(itemsWithOverflow: T[], page: number) {
    let isEnd = true;
    if (itemsWithOverflow.length > pageSize) {
      isEnd = false;
      itemsWithOverflow.pop();
    }

    this.isEnd = isEnd;
    this.items = itemsWithOverflow;
    this.page = page;
  }
};

export type IDatabase = {
  getReportsForAllUsers: (from: string, to: string, page?: number) => Promise<ResultSet<MerchantPercentile>>,
  getReportsForUser: (userId: number, from: string, to:string, page?: number) => Promise<ResultSet<MerchantPercentile>>
  end: () => void
}

export class Database implements IDatabase {
  private readonly pool : Pool = new Pool({
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '')
  });

  async getReportsForAllUsers(from: string, to: string, page?: number) : Promise<ResultSet<MerchantPercentile>> {
    const res = await this.pool.query(
      `
      SELECT user_id, merchant_id, percentile 
      FROM "Transactions_report"($1::date, $2::date)
      LIMIT $3 OFFSET $4;`, 
      [from, to, pageSize + 1, (page || 0) * pageSize]
    );

    return new ResultSet(res.rows, page || 0);
  }

  async getReportsForUser(userId: number, from: string, to:string, page?: number) : Promise<ResultSet<MerchantPercentile>> {
    const res = await this.pool.query(
      `
      SELECT user_id, merchant_id, percentile 
      FROM "Transactions_report"($2::date, $3::date)
      WHERE user_id::int = $1
      LIMIT $4 OFFSET $5;`, 
      [userId, from, to, pageSize + 1, (page || 0) * pageSize]
    );

    return new ResultSet(res.rows, page || 0);
  }

  async end() : Promise<void> {
    await this.pool.end();
  } 
}

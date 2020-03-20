import { IDatabase, ResultSet, MerchantPercentile } from './database';
import { Request, Response } from 'express';
import { handePercentilesRequest } from './handlePercentilesRequest';

describe('handlePercentilesRequest', () => {
  let mockDb : IDatabase,
      handler : (req: Request, res: Response) => Promise<void>,
      res: Response;

  const dbResult = <ResultSet<MerchantPercentile>> {};

  beforeEach(() => {
    mockDb = {
      getReportsForAllUsers: jest.fn(() => Promise.resolve(dbResult)),
      getReportsForUser: jest.fn(() => Promise.resolve(dbResult)),
      end: jest.fn()
    };

    handler = handePercentilesRequest(mockDb);

    res = <Response> <unknown> {
      status: jest.fn(() => res),
      send: jest.fn(() => res),
      json: jest.fn(() => res)
    };
  });

  it('rejects if "from" parameter is missing', async () => {
    const req = <Request> <unknown> {query: {to: '2000-01-02'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'from' is required/);
  })

  it('rejects if "from" parameter is invalid', async () => {
    const req = <Request> <unknown> {query: {from: '2000', to: '2000-01-02'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'from' is required/);
  })

  it('rejects if "to" parameter is missing', async () => {
    const req = <Request> <unknown> {query: {from: '2000-01-01'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'to' is required/);
  })

  it('rejects if "from" parameter is invalid', async () => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'to' is required/);
  })

  it('rejects if "to" parameter is earlier than "from"', async () => {
    const req = <Request> <unknown> {query: {from: '2000-01-02', to: '2000-01-01'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/on or after 'from'/)
  })

  it('rejects if "userId" parameter present and invalid', async () => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02', userId: 'foo'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'userId'/)
  })

  it('rejects if "page" parameter present and invalid', async () => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02', page: 'foo'}};
    await handler(req,res);
    expect (res.status).toHaveBeenCalledWith(400);
    expect((res.send as any).mock.calls[0][0]).toMatch(/'page'/)
  })

  it('returns all users if no userId is given', async() => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02'}};
    await handler(req,res);
    expect(res.json).toHaveBeenCalledWith(dbResult);
    expect(mockDb.getReportsForAllUsers).toHaveBeenCalledWith(req.query.from, req.query.to, 0);
  })

  it('returns one user if userId is given', async() => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02', userId: '0'}};
    await handler(req,res);
    expect(res.json).toHaveBeenCalledWith(dbResult);
    expect(mockDb.getReportsForUser).toHaveBeenCalledWith(req.query.userId, req.query.from, req.query.to, 0);
  })

  it('passes through the page number if given (all users)', async() => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02', page: '1'}};
    await handler(req,res);
    expect(res.json).toHaveBeenCalledWith(dbResult);
    expect(mockDb.getReportsForAllUsers).toHaveBeenCalledWith(req.query.from, req.query.to, 1);
  })

  it('passes through the page number if given (one user)', async() => {
    const req = <Request> <unknown> {query: {from: '2000-01-01', to: '2000-01-02', userId: '0', page: '1'}};
    await handler(req,res);
    expect(res.json).toHaveBeenCalledWith(dbResult);
    expect(mockDb.getReportsForUser).toHaveBeenCalledWith(req.query.userId, req.query.from, req.query.to, 1);
  })
});

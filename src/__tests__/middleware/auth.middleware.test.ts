import { Request, Response, NextFunction } from 'express';
import { authMiddleware, adminAuthMiddleware } from '../../middleware/auth.middleware';

const VALID_KEY = 'test-api-key';
const VALID_ADMIN_KEY = 'test-admin-key';

function makeReqRes(headers: Record<string, string> = {}): {
  req: Partial<Request>;
  res: Partial<Response>;
  next: NextFunction;
} {
  const req = { headers } as unknown as Partial<Request>;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Partial<Response>;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

beforeEach(() => {
  process.env.API_KEY = VALID_KEY;
  process.env.ADMIN_API_KEY = VALID_ADMIN_KEY;
});

afterEach(() => {
  delete process.env.API_KEY;
  delete process.env.ADMIN_API_KEY;
});

describe('authMiddleware', () => {
  it('calls next() when the correct API key is provided', () => {
    const { req, res, next } = makeReqRes({ 'x-api-key': VALID_KEY });
    authMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when the API key is missing', () => {
    const { req, res, next } = makeReqRes({});
    authMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the API key is wrong', () => {
    const { req, res, next } = makeReqRes({ 'x-api-key': 'wrong-key' });
    authMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the admin key is provided instead of the regular key', () => {
    const { req, res, next } = makeReqRes({ 'x-api-key': VALID_ADMIN_KEY });
    authMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('adminAuthMiddleware', () => {
  it('calls next() when the correct admin API key is provided', () => {
    const { req, res, next } = makeReqRes({ 'x-api-key': VALID_ADMIN_KEY });
    adminAuthMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when the admin key is missing', () => {
    const { req, res, next } = makeReqRes({});
    adminAuthMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the regular (read-only) API key is used instead of the admin key', () => {
    const { req, res, next } = makeReqRes({ 'x-api-key': VALID_KEY });
    adminAuthMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

import { Request, Response, NextFunction } from 'express';

function createApiKeyMiddleware(envVarName: string) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['x-api-key'];
    const expected = process.env[envVarName];

    if (!expected || !apiKey || apiKey !== expected) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    next();
  };
}

// Gates the public, read-only GET /quote/random endpoint. This key ships
// inside the Chrome extension bundle and is not truly secret.
export const authMiddleware = createApiKeyMiddleware('API_KEY');

// Gates the write path (POST /quotes). Must never be embedded in any
// client-side bundle — known only to the trusted quote-creation script.
export const adminAuthMiddleware = createApiKeyMiddleware('ADMIN_API_KEY');

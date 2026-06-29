import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { quoteService } from '../services/quote.service.js';

const router = Router();

router.get('/quote/random', authMiddleware, (_req: Request, res: Response) => {
  const quote = quoteService.getRandomQuote();
  res.status(200).json(quote);
});

export default router;

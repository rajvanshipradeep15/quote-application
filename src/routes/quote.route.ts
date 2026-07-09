import { Router, Request, Response } from 'express';
import { authMiddleware, adminAuthMiddleware } from '../middleware/auth.middleware.js';
import { quoteService } from '../services/quote.service.js';
import { QuoteCategory } from '../types/index.js';

const router = Router();
const VALID_CATEGORIES: QuoteCategory[] = ['playful', 'emotional', 'poetic'];

router.get('/quote/random', authMiddleware, (_req: Request, res: Response) => {
  const quote = quoteService.getRandomQuote();
  res.status(200).json(quote);
});

router.post('/quotes', adminAuthMiddleware, (req: Request, res: Response) => {
  const { text, author, category } = req.body ?? {};

  if (typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  if (typeof author !== 'string' || author.trim().length === 0) {
    res.status(400).json({ error: 'author is required' });
    return;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    return;
  }

  const quote = quoteService.addQuote(text.trim(), author.trim(), category);
  res.status(201).json(quote);
});

export default router;

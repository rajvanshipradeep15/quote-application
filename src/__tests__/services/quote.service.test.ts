import { quoteService } from '../../services/quote.service';

describe('QuoteService', () => {
  describe('getRandomQuote', () => {
    it('returns a quote with text, author, and category', () => {
      const quote = quoteService.getRandomQuote();
      expect(typeof quote.text).toBe('string');
      expect(typeof quote.author).toBe('string');
      expect(['playful', 'emotional', 'poetic']).toContain(quote.category);
      expect(quote.text.length).toBeGreaterThan(0);
      expect(quote.author.length).toBeGreaterThan(0);
    });

    it('loads all 60 quotes across the three categories', () => {
      expect(quoteService.getPoolSize()).toBe(60);
    });

    it('adds served quote index to the recent buffer', () => {
      const before = quoteService.getRecentIndices().length;
      quoteService.getRandomQuote();
      expect(quoteService.getRecentIndices().length).toBeGreaterThan(before);
    });

    it('does not return the same quote twice in 10 consecutive calls', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const q = quoteService.getRandomQuote();
        seen.add(q.text);
      }
      expect(seen.size).toBe(10);
    });

    it('evicts the oldest index once the buffer exceeds 10', () => {
      for (let i = 0; i < 12; i++) {
        quoteService.getRandomQuote();
      }
      expect(quoteService.getRecentIndices().length).toBeLessThanOrEqual(10);
    });
  });
});

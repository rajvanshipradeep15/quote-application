import { quoteService } from '../../services/quote.service';
import playful from '../../data/playful.json';
import emotional from '../../data/emotional.json';
import poetic from '../../data/poetic.json';

const SEEDED_TOTAL = playful.length + emotional.length + poetic.length;

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

    it('seeds the database with all quotes from the bundled JSON files', () => {
      expect(quoteService.getPoolSize()).toBe(SEEDED_TOTAL);
    });

    it('adds the served quote id to the recent buffer', () => {
      const before = quoteService.getRecentIds().length;
      quoteService.getRandomQuote();
      expect(quoteService.getRecentIds().length).toBeGreaterThan(before);
    });

    it('does not return the same quote twice in 10 consecutive calls', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const q = quoteService.getRandomQuote();
        seen.add(q.text);
      }
      expect(seen.size).toBe(10);
    });

    it('evicts the oldest id once the buffer exceeds 10', () => {
      for (let i = 0; i < 12; i++) {
        quoteService.getRandomQuote();
      }
      expect(quoteService.getRecentIds().length).toBeLessThanOrEqual(10);
    });
  });

  describe('addQuote', () => {
    it('inserts a new quote and returns it', () => {
      const before = quoteService.getPoolSize();
      const created = quoteService.addQuote('A brand new quote.', 'Test Author', 'playful');

      expect(created).toEqual({ text: 'A brand new quote.', author: 'Test Author', category: 'playful' });
      expect(quoteService.getPoolSize()).toBe(before + 1);
    });

    it('makes the new quote eligible to be served', () => {
      quoteService.addQuote('Findable quote for testing.', 'Test Author', 'emotional');

      let found = false;
      for (let i = 0; i < 200 && !found; i++) {
        if (quoteService.getRandomQuote().text === 'Findable quote for testing.') found = true;
      }
      expect(found).toBe(true);
    });
  });
});

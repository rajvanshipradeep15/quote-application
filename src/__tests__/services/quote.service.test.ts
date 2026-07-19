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

      // Probabilistic (random selection over the whole pool), so use enough
      // draws that a false negative is vanishingly unlikely regardless of
      // how large the pool has grown from earlier tests in this file.
      let found = false;
      for (let i = 0; i < 3000 && !found; i++) {
        if (quoteService.getRandomQuote().text === 'Findable quote for testing.') found = true;
      }
      expect(found).toBe(true);
    });
  });

  describe('getAllQuotes', () => {
    it('returns every quote currently in the database', () => {
      const all = quoteService.getAllQuotes();
      expect(all.length).toBe(quoteService.getPoolSize());
      for (const q of all) {
        expect(typeof q.text).toBe('string');
        expect(typeof q.author).toBe('string');
        expect(['playful', 'emotional', 'poetic']).toContain(q.category);
      }
    });

    it('includes a quote added via addQuote', () => {
      quoteService.addQuote('A quote findable via getAllQuotes.', 'Test Author', 'playful');
      const all = quoteService.getAllQuotes();
      expect(all.some((q) => q.text === 'A quote findable via getAllQuotes.')).toBe(true);
    });
  });

  describe('recordHit / getHitStats', () => {
    it('creates a row with count 1 the first time a date is hit', () => {
      quoteService.recordHit('2026-01-01');
      expect(quoteService.getHitStats()).toContainEqual({ date: '2026-01-01', count: 1 });
    });

    it('increments the count for repeated hits on the same date', () => {
      quoteService.recordHit('2026-01-02');
      quoteService.recordHit('2026-01-02');
      quoteService.recordHit('2026-01-02');
      expect(quoteService.getHitStats()).toContainEqual({ date: '2026-01-02', count: 3 });
    });

    it('tracks separate dates independently', () => {
      quoteService.recordHit('2026-02-01');
      quoteService.recordHit('2026-02-02');
      const stats = quoteService.getHitStats();
      expect(stats).toContainEqual({ date: '2026-02-01', count: 1 });
      expect(stats).toContainEqual({ date: '2026-02-02', count: 1 });
    });

    it('returns stats ordered by date ascending', () => {
      quoteService.recordHit('2026-03-05');
      quoteService.recordHit('2026-03-01');
      quoteService.recordHit('2026-03-03');
      const dates = quoteService.getHitStats().map((s) => s.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });
  });

  describe('deleteQuoteByText', () => {
    it('removes a matching quote and returns the number of rows deleted', () => {
      quoteService.addQuote('A quote to delete.', 'Test Author', 'poetic');
      const before = quoteService.getPoolSize();

      const deleted = quoteService.deleteQuoteByText('A quote to delete.');

      expect(deleted).toBe(1);
      expect(quoteService.getPoolSize()).toBe(before - 1);
    });

    it('returns 0 when no quote matches the given text', () => {
      const deleted = quoteService.deleteQuoteByText('This text does not exist anywhere.');
      expect(deleted).toBe(0);
    });
  });
});

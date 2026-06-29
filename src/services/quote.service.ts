import { QuoteWithCategory } from '../types/index.js';
import playful from '../data/playful.json';
import emotional from '../data/emotional.json';
import poetic from '../data/poetic.json';

const DEDUP_BUFFER_SIZE = 10;

function buildQuotePool(): QuoteWithCategory[] {
  return [
    ...playful.map((q) => ({ ...q, category: 'playful' as const })),
    ...emotional.map((q) => ({ ...q, category: 'emotional' as const })),
    ...poetic.map((q) => ({ ...q, category: 'poetic' as const })),
  ];
}

class QuoteService {
  private readonly pool: QuoteWithCategory[] = buildQuotePool();
  private recentIndices: number[] = [];

  getRandomQuote(): QuoteWithCategory {
    const available = this.pool
      .map((_, i) => i)
      .filter((i) => !this.recentIndices.includes(i));

    const idx = available[Math.floor(Math.random() * available.length)];

    this.recentIndices.push(idx);
    if (this.recentIndices.length > DEDUP_BUFFER_SIZE) {
      this.recentIndices.shift();
    }

    return this.pool[idx];
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  getRecentIndices(): number[] {
    return [...this.recentIndices];
  }
}

export const quoteService = new QuoteService();

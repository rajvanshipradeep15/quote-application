import { db } from '../db/index.js';
import { QuoteCategory, QuoteWithCategory } from '../types/index.js';

const DEDUP_BUFFER_SIZE = 10;

interface QuoteRow {
  id: number;
  text: string;
  author: string;
  category: QuoteCategory;
}

class QuoteService {
  private recentIds: number[] = [];

  getRandomQuote(): QuoteWithCategory {
    const row = this.pickExcluding(this.recentIds) ?? this.pickExcluding([]);
    if (!row) throw new Error('No quotes available');

    this.recentIds.push(row.id);
    if (this.recentIds.length > DEDUP_BUFFER_SIZE) {
      this.recentIds.shift();
    }

    return { text: row.text, author: row.author, category: row.category };
  }

  addQuote(text: string, author: string, category: QuoteCategory): QuoteWithCategory {
    db.prepare('INSERT INTO quotes (text, author, category) VALUES (?, ?, ?)').run(text, author, category);
    return { text, author, category };
  }

  // Deletes every row with an exact text match and returns how many were removed.
  deleteQuoteByText(text: string): number {
    return db.prepare('DELETE FROM quotes WHERE text = ?').run(text).changes;
  }

  getAllQuotes(): QuoteWithCategory[] {
    return db.prepare('SELECT text, author, category FROM quotes').all() as QuoteWithCategory[];
  }

  getPoolSize(): number {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM quotes').get() as { count: number };
    return count;
  }

  getRecentIds(): number[] {
    return [...this.recentIds];
  }

  // Increments today's hit count (UTC date), creating the row if needed.
  recordHit(date: string = new Date().toISOString().slice(0, 10)): void {
    db.prepare(
      `INSERT INTO hits (date, count) VALUES (?, 1)
       ON CONFLICT(date) DO UPDATE SET count = count + 1`
    ).run(date);
  }

  getHitStats(): { date: string; count: number }[] {
    return db.prepare('SELECT date, count FROM hits ORDER BY date ASC').all() as {
      date: string;
      count: number;
    }[];
  }

  // Excludes ids currently in the dedup buffer. Falls back to the full pool
  // (excluding nothing) when every quote has been excluded — only relevant
  // for very small pools where the buffer can outgrow the available quotes.
  private pickExcluding(excludedIds: number[]): QuoteRow | undefined {
    if (excludedIds.length === 0) {
      return db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get() as QuoteRow | undefined;
    }
    const placeholders = excludedIds.map(() => '?').join(',');
    return db
      .prepare(`SELECT * FROM quotes WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`)
      .get(...excludedIds) as QuoteRow | undefined;
  }
}

export const quoteService = new QuoteService();

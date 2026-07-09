import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import playful from '../data/playful.json';
import emotional from '../data/emotional.json';
import poetic from '../data/poetic.json';
import { QuoteCategory } from '../types/index.js';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'quotes.db');
const DB_PATH = process.env.DB_PATH ?? (process.env.NODE_ENV === 'test' ? ':memory:' : DEFAULT_DB_PATH);

if (DB_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('playful', 'emotional', 'poetic'))
  )
`);

// One-time seed: only runs against a fresh/empty database (e.g. a new Railway
// volume). Once quotes exist, this is a no-op — all future additions go
// through the POST /quotes endpoint instead of the bundled JSON snapshot.
function seedIfEmpty(): void {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM quotes').get() as { count: number };
  if (count > 0) return;

  type SeedRow = { text: string; author: string; category: QuoteCategory };
  const seedRows: SeedRow[] = [
    ...playful.map((q) => ({ ...q, category: 'playful' as const })),
    ...emotional.map((q) => ({ ...q, category: 'emotional' as const })),
    ...poetic.map((q) => ({ ...q, category: 'poetic' as const })),
  ];

  const insert = db.prepare('INSERT INTO quotes (text, author, category) VALUES (@text, @author, @category)');
  const insertMany = db.transaction((rows: SeedRow[]) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(seedRows);
}

seedIfEmpty();

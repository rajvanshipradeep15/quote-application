export type QuoteCategory = 'playful' | 'emotional' | 'poetic';

export interface Quote {
  text: string;
  author: string;
}

export interface QuoteWithCategory extends Quote {
  category: QuoteCategory;
}

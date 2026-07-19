import { EventEmitter } from 'events';

// Fired once a random quote has been sent to the client. Listeners (e.g. hit
// tracking) attach side effects here so the response never waits on them.
export const QUOTE_SERVED = 'quote:served';

export const quoteEvents = new EventEmitter();

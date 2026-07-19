import { quoteEvents, QUOTE_SERVED } from '../events/quoteEvents.js';
import { quoteService } from '../services/quote.service.js';

// Deferred via setImmediate so the DB write always runs after the response
// for this request has already been handed off, never adding latency to it.
quoteEvents.on(QUOTE_SERVED, () => {
  setImmediate(() => quoteService.recordHit());
});

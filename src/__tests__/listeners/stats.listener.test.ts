import '../../listeners/stats.listener';
import { quoteEvents, QUOTE_SERVED } from '../../events/quoteEvents';
import { quoteService } from '../../services/quote.service';

describe('stats.listener', () => {
  it('records a hit when QUOTE_SERVED is emitted, without blocking the emit call', async () => {
    const before = quoteService
      .getHitStats()
      .reduce((sum, row) => sum + row.count, 0);

    quoteEvents.emit(QUOTE_SERVED);

    // Recording is deferred via setImmediate, so it must not have happened yet.
    const immediatelyAfter = quoteService
      .getHitStats()
      .reduce((sum, row) => sum + row.count, 0);
    expect(immediatelyAfter).toBe(before);

    await new Promise((resolve) => setImmediate(resolve));

    const after = quoteService.getHitStats().reduce((sum, row) => sum + row.count, 0);
    expect(after).toBe(before + 1);
  });
});

import { binance, Dictionary, Ticker } from 'ccxt';
import { Watcher } from '.';

export
class TickersWatcher
extends Watcher<Dictionary<Ticker>> {
  public constructor(
    private client: binance,
    private interval = 1000,
    private symbols: string[],
  ) {
    super();
  }

  private timer: NodeJS.Timer | null = null;

  public Start() {
    clearTimeout(this.timer as any);
    this.timer = setTimeout(async () => {
      try {
        const data = await this.client.fetchTickers(this.symbols);
        this.update(data);
      } catch (e) {
        this.logger.error(e);
      } finally {
        if (this.timer) {
          this.Start();
        }
      }
    }, this.interval);
  }

  public Stop() {
    this.timer = null;
  }
}

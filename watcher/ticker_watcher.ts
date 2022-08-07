import { binance, Ticker } from 'ccxt';
import { Watcher } from '.';

export
class TickerWatcher
extends Watcher<Ticker> {
  public constructor(
    private client: binance,
    private interval = 1000,
    private symbol: string,
  ) {
    super();
  }

  private timer: NodeJS.Timer | null = null;

  public Start() {
    clearTimeout(this.timer as any);
    this.timer = setTimeout(async () => {
      try {
        const data = await this.client.fetchTicker(this.symbol);
        this.update(data);
      } catch (e) {
        console.error(e);
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

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

  private timer!: NodeJS.Timer;

  public Start() {
    this.timer = setInterval(async () => {
      try {
        const data = await this.client.fetchTickers(this.symbols);
        this.update(data);
      } catch (e) {
        console.error(e);
      }
    }, this.interval);
  }

  public Stop() {
    clearInterval(this.timer);
  }
}

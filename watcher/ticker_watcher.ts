import { binance, Ticker } from 'ccxt';
import { Watcher } from '.';

export
class TickersWatcher
extends Watcher<Ticker> {
  public constructor(
    private client: binance,
    private interval = 1000,
    private symbol: string,
  ) {
    super();
  }

  private timer!: NodeJS.Timer;

  public Start() {
    this.timer = setInterval(async () => {
      try {
        const data = await this.client.fetchTicker(this.symbol);
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

import { binance, Ticker } from 'ccxt';
import moment from 'moment';
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
        const now = new Date();
        console.log(moment(now).format('YYYY-MM-DD HH:mm:ss'), Number(now));
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

import { binance } from 'ccxt';
import { ArrayToKLine, IOHLCV, KLine } from '../common/kline';
import { Watcher } from '.';

export
class KLineWatcher
extends Watcher<KLine> {
  public constructor(
    private client: binance,
    private interval = 1000,
    private symbol: string,
    private timeframe: string,
    private length: number,
  ) {
    super();
  }

  private timer!: NodeJS.Timer;

  public Start() {
    this.timer = setInterval(async () => {
      try {
        const list = await this.client.fetchOHLCV(this.symbol, this.timeframe, undefined, this.length);
        const kline = ArrayToKLine(list);
        this.update(kline);
      } catch (e) {
        console.error(e);
      }
    }, this.interval);
  }

  public Stop() {
    clearInterval(this.timer);
  }
}

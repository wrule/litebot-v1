import { binance } from 'ccxt';
import { ArrayToKLine, IOHLCV } from '../common/kline';
import { Watcher } from '.';

export
class KLineWatcher
extends Watcher<[IOHLCV[], IOHLCV]> {
  public constructor(
    private client: binance,
    private interval = 1000,
    private symbol: string,
    private timeframe: string,
    private length: number,
  ) {
    super();
  }

  private timer: NodeJS.Timer | null = null;

  public Start() {
    clearTimeout(this.timer as any);
    this.timer = setTimeout(async () => {
      try {
        const list = await this.client.fetchOHLCV(this.symbol, this.timeframe, undefined, this.length);
        const kline = ArrayToKLine(list);
        if (kline.length > 0) {
          this.update([
            kline.slice(0, kline.length - 1),
            kline[kline.length - 1],
          ]);
        }
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

import { binance } from 'ccxt';
import { ArrayToKLineSnapshot, IKLineSnapshot } from '../common/kline';
import { Watcher } from '.';

export
class KLineWatcher
extends Watcher<IKLineSnapshot> {
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
        const kline_snapshot = ArrayToKLineSnapshot(list);
        this.update(kline_snapshot);
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

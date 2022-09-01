// 2022年09月01日16:02:44
import { IOHLCV } from '../../../common/kline';
import { OHLCV_Queue } from '../../../common/time_close_queue';

export
class CloseQueue
extends OHLCV_Queue<IOHLCV> {
  public constructor(config: { close_candles: number }) {
    super(config.close_candles);
  }

  public High() {
    if (!this.IsFull) return Infinity;
    return Math.max(...this.queue.map((item) => item.high));
  }

  public Low() {
    if (!this.IsFull) return -Infinity;
    return Math.min(...this.queue.map((item) => item.low));
  }
}

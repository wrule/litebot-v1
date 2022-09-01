// 2022年09月01日15:42:13
import { IOHLCV } from '../../../common/kline';
import { TimeCloseQueue } from '../../../common/time_close_queue';

export
interface IOHLCV_IsCross
extends IOHLCV {
  is_cross?: boolean;
}

export
class OpenQueue
extends TimeCloseQueue<IOHLCV_IsCross> {
  public constructor(config: {
    cross_window_limit: number,
    cross_limit: number,
  }) {
    super(config.cross_window_limit);
    this.cross_limit = config.cross_limit;
    if (this.cross_limit < 1) throw 'cross_limit必须大于等于1';
  }

  private readonly cross_limit: number;

  private get_cross_list() {
    const result = this.queue.filter((item) => item.is_cross);
    const diff = result.length - this.cross_limit;
    if (diff > 0) result.splice(0, diff);
    return result;
  }

  public High() {
    const cross_list = this.get_cross_list();
    if (cross_list.length < this.cross_limit) return Infinity;
    return Math.max(...cross_list.map((cross) => cross.high));
  }

  public Low() {
    const cross_list = this.get_cross_list();
    if (cross_list.length < this.cross_limit) return -Infinity;
    return Math.min(...cross_list.map((cross) => cross.low));
  }
}

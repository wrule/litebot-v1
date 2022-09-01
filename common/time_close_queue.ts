import { IOHLCV, ITimeClose } from './kline';

export
class TimeCloseQueue<T extends ITimeClose> {
  public constructor(protected readonly limit: number) {
    if (this.limit < 1) throw 'limit必须大于等于1';
  }

  protected readonly queue: T[] = [];

  public get Length() {
    return this.queue.length;
  }

  public get IsFull() {
    return this.queue.length >= this.limit;
  }

  public Append(item: T) {
    this.queue.push(item);
    const diff = this.queue.length - this.limit;
    if (diff > 0) {
      this.queue.splice(0, diff);
    }
  }
}

export
class OHLCV_Queue<T extends IOHLCV>
extends TimeCloseQueue<T> { }

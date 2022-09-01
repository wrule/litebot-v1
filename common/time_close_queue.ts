import { ITimeClose } from './kline';

export
class TimeCloseQueue<T extends ITimeClose> {
  public constructor(private readonly limit: number) {
    if (this.limit < 1) throw 'limit必须大于等于1';
  }

  private queue: T[] = [];

  public get Length() {
    return this.queue.length;
  }

  public Append(item: T) {
    this.queue.push(item);
    const diff = this.queue.length - this.limit;
    if (diff > 0) {
      this.queue.splice(0, diff);
    }
  }
}

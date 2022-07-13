import { IOHLCV, KLine } from '@/common/kline';
import { INotifier } from '@/notifier';
import { ISpotExecutor } from '../../executor/spot';

export
abstract class SpotRobot<TestData extends IOHLCV> {
  public constructor(
    protected executor: ISpotExecutor,
    protected notifier?: INotifier,
  ) { }

  public async SendMessage(message: string) {
    if (this.notifier) {
      await this.notifier.SendMessage(message);
    }
  }

  private kline_last_time = -1;

  public abstract KLineReadyLength: number;

  public CheckKLine<T extends KLine>(kline: T) {
    if (kline.length >= this.KLineReadyLength) {
      const last = kline[kline.length - 1];
      if (last.time > this.kline_last_time) {
        this.kline_last_time = last.time;
        const confirmed_kline = kline.filter((item) => item.confirmed);
        this.checkKLine(confirmed_kline, last, kline);
      }
    }
  }

  protected abstract checkKLine<T extends IOHLCV>(
    confirmed_kline: T[],
    last: T,
    kline: T[],
  ): void;


  private testKLine: TestData[] = [];
  private current = 0;

  protected last(offset = 0) {
    const dstIndex = this.current - offset;
    return this.testKLine[dstIndex];
  }

  protected prev() {
    return this.last(1);
  }

  public BackTesting(kline: TestData[]) {
    this.testKLine = kline;
    for (let i = 0; i < kline.length; ++i) {
      this.current = i;
      this.checkBackTesting(this.last());
    }
  }

  protected abstract checkBackTesting(data: TestData): void;

  public Buy(
    in_asset: number,
    price?: number,
    time?: number,
  ) {
    return this.executor.Buy(in_asset, price, time);
  }

  public BuyAll(
    price?: number,
    time?: number,
  ) {
    return this.executor.BuyAll(price, time);
  }

  public Sell(
    in_asset: number,
    price?: number,
    time?: number,
  ) {
    return this.executor.Sell(in_asset, price, time);
  }

  public SellAll(
    price?: number,
    time?: number,
  ) {
    return this.executor.SellAll(price, time);
  }

  protected gold_cross(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return (fast_prev <= slow_prev) && (fast_last > slow_last);
  }

  protected dead_cross(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return (fast_prev >= slow_prev) && (fast_last < slow_last);
  }
}

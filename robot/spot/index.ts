import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '../../executor/spot';
const tulind = require('tulind');

export
abstract class SpotRobot {
  public constructor(
    protected executor: ISpotExecutor,
  ) { }

  public abstract KLineReadyLength: number;

  protected kline_last_time = -1;

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

  public abstract checkKLine<T extends IOHLCV>(
    confirmed_kline: T[],
    last: T,
    kline: T[],
  ): void;

  // public abstract CheckLastKLine<T extends IOHLCV>(data: T): void;

  // public abstract CheckFastTest<T extends IOHLCV>(data: T): void;

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

  protected sma(closes: number[], size: number) {
    let result: number[] = [];
    tulind.indicators.sma.indicator(
      [closes],
      [size],
      (error: any, data: any) => {
        if (error) {
          throw error;
        }
        result = data[0];
      },
    );
    return result;
  }
}

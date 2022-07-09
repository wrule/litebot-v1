const tulind = require('tulind');
import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';

export
interface IFastTestData
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class Turtle
extends SpotRobot {
  public constructor(
    protected readonly executor: ISpotExecutor,
    private readonly fast_ma: number,
    private readonly slow_ma: number,
    private readonly exit_candle_number: number,
  ) {
    super(executor);
  }

  public get KLineReadyLength() {
    return Math.max(
      this.fast_ma,
      this.slow_ma,
      this.exit_candle_number,
    ) + 1;
  }

  private exit_price = -Infinity;

  public CheckKLine(
    kline: KLine,
  ) {
    const confirmed_kline = kline.filter((item) => item.confirmed);

    const lows = confirmed_kline.map((item) => item.low);
    // this.exit_price = Math.min(...(lows.splice()));

    const closes = confirmed_kline.map((item) => item.close);
    const last = kline[kline.length - 1];
    let fast_line: number[] = [];
    let slow_line: number[] = [];
    tulind.indicators.sma.indicator(
      [closes],
      [this.fast_ma],
      (err: any, result: any) => {
        fast_line = result[0];
      },
    );
    tulind.indicators.sma.indicator(
      [closes],
      [this.slow_ma],
      (err: any, result: any) => {
        slow_line = result[0];
      },
    );
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    if (
      (fast_prev <= slow_prev) &&
      (fast_last > slow_last)
    ) {
      this.executor.BuyAll(last.close, Number(new Date()));
    }
  }

  public CheckPrice(
    price: number,
  ) {
    if (price < this.exit_price) {
      this.executor.SellAll(price, Number(new Date()));
    }
  }

  public CheckFastTest(data: IFastTestData) {
    if (data.buy) {
      this.executor.BuyAll(data.close, data.time);
    } else if (data.sell) {
      this.executor.SellAll(data.close, data.time);
    }
  }
}

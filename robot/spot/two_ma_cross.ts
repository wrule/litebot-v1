const tulind = require('tulind');
import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';
import moment from 'moment';

export
interface ITestData
extends IOHLCV {
  buy?: number;
  sell?: number;
}

export
class TwoMaCross
extends SpotRobot<ITestData> {
  public constructor(
    protected readonly executor: ISpotExecutor,
    private readonly fast_ma: number,
    private readonly slow_ma: number,
  ) {
    super(executor);
  }

  private sma(closes: number[], size: number) {
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

  public get KLineReadyLength() {
    return Math.max(this.fast_ma, this.slow_ma) + 2;
  }

  protected checkKLine(
    confirmed_kline: KLine,
    last: IOHLCV,
    kline: KLine,
  ) {
    const closes = confirmed_kline.map((item) => item.close);
    const fast_line = this.sma(closes, this.fast_ma);
    const slow_line = this.sma(closes, this.slow_ma);
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    console.log(
      moment().format('YYYY-MM-DD HH:mm:ss'),
      '前均线差', fast_prev - slow_prev,
      '现均线差', fast_last - slow_last,
    );
    if (this.gold_cross(fast_line, slow_line)) {
      this.BuyAll(last.close, Number(new Date()));
    } else if (this.dead_cross(fast_line, slow_line)) {
      this.SellAll(last.close, Number(new Date()));
    }
  }

  protected checkBackTesting(data: ITestData) {
    if (data.buy) {
      this.BuyAll(data.close, data.time);
    } else if (data.sell) {
      this.SellAll(data.close, data.time);
    }
  }
}
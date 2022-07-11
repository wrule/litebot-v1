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

  private held = false;

  public get KLineReadyLength() {
    return Math.max(
      this.fast_ma,
      this.slow_ma,
      this.exit_candle_number,
    ) + 1;
  }

  private last_time = -1;
  private exit_price = -1;

  public CheckKLine(
    kline: KLine,
  ) {
    if (kline.length >= this.KLineReadyLength) {
      const last = kline[kline.length - 1];
      if (last.time > this.last_time) {
        this.last_time = last.time;
        const confirmed_kline = kline.filter((item) => item.confirmed);
        const lows = confirmed_kline.map((item) => item.low);

        // 金叉判断
        const closes = confirmed_kline.map((item) => item.close);
        const fast_line = this.sma(closes, this.fast_ma);
        const slow_line = this.sma(closes, this.slow_ma);
        if (this.gold_cross(fast_line, slow_line)) {
          console.log('买信号');
        }
      }
    }
  }

  public async CheckPrice(
    price: number,
  ) {
    if (this.held && price < this.exit_price) {
      await this.executor.SellAll(price, Number(new Date()));
      this.held = false;
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

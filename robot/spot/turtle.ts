import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';

export
class Turtle
extends SpotRobot {
  public constructor(
    protected readonly executor: ISpotExecutor,
    private readonly fast_ma: number,
    private readonly slow_ma: number,
  ) {
    super(executor);
  }

  public get KLineReadyLength() {
    return Math.max(this.fast_ma, this.slow_ma) + 1;
  }

  public checkKLine(
    confirmed_kline: KLine,
    last: IOHLCV,
    kline: KLine,
  ) {
    // const closes = confirmed_kline.map((item) => item.close);
    // const fast_line = this.sma(closes, this.fast_ma);
    // const slow_line = this.sma(closes, this.slow_ma);
    // if (this.gold_cross(fast_line, slow_line)) {
    //   this.BuyAll(last.close, Number(new Date()));
    // } else if (this.dead_cross(fast_line, slow_line)) {
    //   this.SellAll(last.close, Number(new Date()));
    // }
  }
}

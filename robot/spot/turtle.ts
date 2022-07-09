import { IOHLCV } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';

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

  public CheckCross(
    prev_fast: number,
    prev_slow: number,
    last_fast: number,
    last_slow: number,
    ohlcv: IOHLCV,
  ) {
    if ( // 金叉检测
      (prev_fast <= prev_slow) &&
      (last_fast > last_slow)
    ) {
      this.executor.BuyAll(ohlcv.close, ohlcv.time);
    }
  }

  public CheckPrice(
    price: number,
  ) {

  }
}

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
    private readonly exit_candle_number: number,
  ) {
    super(executor);
  }

  public CheckKLine(
    kline: KLine,
  ) {

  }

  public CheckPrice(
    price: number,
  ) {

  }
}

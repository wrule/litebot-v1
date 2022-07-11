import { IOHLCV } from '@/common/kline';
import { ISpotExecutor } from '../../executor/spot';

export
abstract class SpotRobot {
  public constructor(
    protected executor: ISpotExecutor,
  ) { }

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

  public abstract CheckFastTest<T extends IOHLCV>(data: T): void;
}

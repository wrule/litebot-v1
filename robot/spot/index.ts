import { IOHLCV } from '@/common/kline';
import { ISpotExecutor } from '../../executor/spot';

export
abstract class SpotRobot {
  public constructor(
    protected executor: ISpotExecutor,
  ) { }

  public abstract CheckFastTest<T extends IOHLCV>(data: T): void;
}

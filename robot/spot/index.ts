import { ISpotExecutor } from '../../executor/spot';

export
class SpotRobot {
  public constructor(
    protected executor: ISpotExecutor,
  ) { }
}

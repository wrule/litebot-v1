import tulind from 'tulind';
import { IOHLCV } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';

export
interface IParams {
  macd_fast_ma: number;
  macd_slow_ma: number;
  macd_diff_ma: number;
  cross_limit: number;
  sold_candles: number;
  atr: number;
  atr_multiplier: number;
}

export
interface ITestData
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class T07
extends SpotRobot<IParams, IOHLCV, ITestData> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ITestData>) {
    super(config);
  }

  private macd(closes: number[], params: {
    macd_fast_ma: number,
    macd_slow_ma: number,
    macd_diff_ma: number,
  }) {
    let result: any = null;
    tulind.indicators.macd.indicator(
      [closes],
      [params.macd_fast_ma, params.macd_slow_ma, params.macd_diff_ma],
      (error: any, data: any) => {
        if (error) throw error;
        result = data;
      },
    );
    return result;
  }

  public get KLineReadyLength() {
    return 0;
  }

  public async checkKLine(confirmed_kline: IOHLCV[], last_confirmed: IOHLCV) {

  }

  public GenerateTestData(real_data: IOHLCV[]): ITestData[] {
    const macd = this.macd(real_data.map((item) => item.close), this.config.params);
    return macd;
  }

  protected checkTestData(data: ITestData): void | Promise<void> {

  }
}

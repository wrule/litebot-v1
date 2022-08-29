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
interface IMACDResult {
  dif: number[];
  dea: number[];
  macd: number[];
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
  }): IMACDResult {
    const result: IMACDResult = { dif: [], dea: [], macd: [], };
    const options = [params.macd_fast_ma, params.macd_slow_ma, params.macd_diff_ma];
    const fill_size: number = tulind.indicators.macd.start(options);
    tulind.indicators.macd.indicator([closes], options, (error: any, data: any) => {
        if (error) throw error;
        result.dif = Array(fill_size).fill(null).concat(data[0]);
        result.dea = Array(fill_size).fill(null).concat(data[1]);
        result.macd = Array(fill_size).fill(null).concat(data[2]);
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
    return macd as any;
  }

  protected checkTestData(data: ITestData): void | Promise<void> {

  }
}

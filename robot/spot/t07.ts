import tulind from 'tulind';
import { IOHLCV } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import moment from 'moment';

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
  price?: boolean;
}

export
interface IMACDResult {
  start: number;
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

  private macd_start(params: {
    macd_fast_ma: number,
    macd_slow_ma: number,
    macd_diff_ma: number,
  }) {
    return tulind.indicators.macd.start([
      params.macd_fast_ma,
      params.macd_slow_ma,
      params.macd_diff_ma,
    ]);
  }

  private macd(closes: number[], params: {
    macd_fast_ma: number,
    macd_slow_ma: number,
    macd_diff_ma: number,
  }): IMACDResult {
    const result: IMACDResult = { start: 0, dif: [], dea: [], macd: [], };
    const options = [params.macd_fast_ma, params.macd_slow_ma, params.macd_diff_ma];
    result.start = this.macd_start(params);
    tulind.indicators.macd.indicator([closes], options, (error: any, data: any) => {
        if (error) throw error;
        result.dif = Array(result.start).fill(null).concat(data[0]);
        result.dea = Array(result.start).fill(null).concat(data[1]);
        result.macd = Array(result.start).fill(null).concat(data[2]);
      },
    );
    return result;
  }

  public get KLineReadyLength() {
    return Math.max(
      this.macd_start(this.config.params),
    ) + 2;
  }

  public async checkKLine(confirmed_kline: IOHLCV[], last_confirmed: IOHLCV) {

  }

  public GenerateTestData(real_data: IOHLCV[]): ITestData[] {
    const { macd } = this.macd(real_data.map((item) => item.close), this.config.params);
    console.log(macd.length);
    console.log(this.KLineReadyIndex);
    const a = real_data.map((item, index) => {
      const result: ITestData = { ...item };
      if (index >= this.KLineReadyIndex) {
        const macd_last = macd[index];
        const macd_prev = macd[index - 1];
        if (macd_last > 0 && macd_prev <= 0) {
          result.buy = true;
        }
        if (macd_last < 0 && macd_prev >= 0) {
          result.sell = true;
        }
      }
      return result;
    });
    const b = a
      .filter((item) => item.buy || item.sell)
      .map((item) => ({ ...item, time: moment(new Date(item.time)).format('YYYY-MM-DD HH:mm:ss') }));
    console.log(b.slice(b.length - 3));
    return [];
  }

  protected checkTestData(data: ITestData): void | Promise<void> {

  }
}

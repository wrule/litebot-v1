import tulind from 'tulind';
import { IOHLCV, KLine } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import moment from 'moment';


export
class OHLCVQueue {
  public constructor(private readonly limit: number) {
    if (this.limit < 1) throw 'limit必须大于等于1';
  }

  private kline: KLine = [];

  public Push(ohlcv: IOHLCV) {
    this.kline.push(ohlcv);
    const diff = this.kline.length - this.limit;
    if (diff > 0) this.kline.splice(this.limit, diff);
  }

  public get High() {
    if (this.kline.length < this.limit) return Infinity;
    return Math.max(...this.kline.map((item) => item.high));
  }

  public get Low() {
    if (this.kline.length < this.limit) return -Infinity;
    return Math.min(...this.kline.map((item) => item.low));
  }
}

export
function BreakUp(ohlcv: IOHLCV, threshold: number) {
  if (ohlcv.open > threshold) return ohlcv.open;
  if (ohlcv.high > threshold) return threshold;
  return null;
}

export
function BreakDown(ohlcv: IOHLCV, threshold: number) {
  if (ohlcv.open < threshold) return ohlcv.open;
  if (ohlcv.low < threshold) return threshold;
  return null;
}

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
  price?: number;
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
    this.buy_queue = new OHLCVQueue(this.config.params.cross_limit);
    this.sell_queue = new OHLCVQueue(this.config.params.sold_candles);
  }

  private buy_queue!: OHLCVQueue;
  private sell_queue!: OHLCVQueue;

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

        // 买入点信号生成
        const break_up_price = BreakUp(item, this.buy_queue.High);
        if (break_up_price != null) {
          result.buy = true;
          result.price = break_up_price;
        }

        // 记录金叉或死叉
        if ((macd_last > 0 && macd_prev <= 0) || (macd_last < 0 && macd_prev >= 0))
          this.buy_queue.Push(item);
      }
      return result;
    });

    return [];
  }

  protected checkTestData(data: ITestData): void | Promise<void> {

  }
}

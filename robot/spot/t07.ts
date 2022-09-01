import tulind from 'tulind';
import { IOHLCV, KLine } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import moment from 'moment';
import { TimeCloseQueue } from '@/common/time_close_queue';

export
interface IMACDResult {
  dif: number[];
  dea: number[];
  macd: number[];
}


export
class OHLCVQueue {
  public constructor(private readonly limit: number) {
    if (this.limit < 1) throw 'limit必须大于等于1';
  }

  private kline: KLine = [];

  public Append(ohlcv: IOHLCV) {
    this.kline.push(ohlcv);
    const diff = this.kline.length - this.limit;
    if (diff > 0) this.kline.splice(0, diff);
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
interface OHLCV_MACD
extends IOHLCV {
  is_cross?: boolean;
}

export
class OpenQueue
extends TimeCloseQueue<OHLCV_MACD> {
  public constructor(config: {
    cross_window_limit: number,
    cross_limit: number,
  }) {
    super(config.cross_window_limit);
    this.cross_limit = config.cross_limit;
  }

  private readonly cross_limit: number;

  private get_cross_list() {
    const result = this.queue.filter((item) => item.is_cross);
    const diff = result.length - this.cross_limit;
    if (diff > 0) result.splice(0, diff);
    return result;
  }

  public High() {
    const cross_list = this.get_cross_list();
    if (cross_list.length < this.cross_limit) return Infinity;
    return Math.max(...cross_list.map((cross) => cross.high));
  }

  public Low() {
    const cross_list = this.get_cross_list();
    if (cross_list.length < this.cross_limit) return -Infinity;
    return Math.min(...cross_list.map((cross) => cross.low));
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

  cross_window_limit: number;
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
class T07
extends SpotRobot<IParams, IOHLCV, ITestData> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ITestData>) {
    super(config);
    this.buy_queue = new OpenQueue(this.config.params);
    this.sell_queue = new OHLCVQueue(this.config.params.sold_candles);
  }

  private buy_queue!: OpenQueue;
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
    const result: IMACDResult = { dif: [], dea: [], macd: [], };
    const options = [params.macd_fast_ma, params.macd_slow_ma, params.macd_diff_ma];
    const start = this.macd_start(params);
    tulind.indicators.macd.indicator([closes], options, (error: any, data: any) => {
        if (error) throw error;
        result.dif = Array(start).fill(null).concat(data[0]);
        result.dea = Array(start).fill(null).concat(data[1]);
        result.macd = Array(start).fill(null).concat(data[2]);
      },
    );
    return result;
  }

  private atr_start(params: { atr_period: number }): number {
    return tulind.indicators.atr.start([params.atr_period]);
  }

  private atr(
    high: number[],
    low: number[],
    close: number[],
    params: { atr_period: number },
  ) {
    const options = [params.atr_period];
    const start = this.atr_start(params);
    tulind.indicators.atr.indicator([high, low, close], options, (error: any, data: any) => {
        if (error) throw error;
        return Array(start).fill(null).concat(data[0]);
      },
    );
    throw 'atr指标没有被计算';
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
    let prev_signal = '';
    return real_data.map((item, index) => {
      const data: ITestData = { ...item };
      // 卖出点信号检测
      if (!prev_signal || prev_signal === 'buy') {
        const break_down_price = BreakDown(item, this.sell_queue.Low);
        data.sell = break_down_price != null;
        data.price = (data.sell ? break_down_price : data.price) as number;
        prev_signal = data.sell ? 'sell' : prev_signal;
      }
      // 买入点信号检测
      if (!prev_signal || prev_signal === 'sell') {
        const break_up_price = BreakUp(item, this.buy_queue.High);
        data.buy = break_up_price != null;
        data.price = (data.buy ? break_up_price : data.price) as number;
        prev_signal = data.buy ? 'buy' : prev_signal;
      }
      // 记录卖出信号数据源(K线)
      this.sell_queue.Append(item);
      // 记录买入信号数据源(金叉死叉)
      if (index >= this.KLineReadyIndex) {
        const macd_last = macd[index];
        const macd_prev = macd[index - 1];
        if ((macd_last > 0 && macd_prev <= 0) || (macd_last < 0 && macd_prev >= 0))
          this.buy_queue.Append(item);
      }
      return data;
    });
  }

  protected async checkTestData(data: ITestData) {
    if (data.buy) {
      await this.config.executor.BuyAll(data.price, data.time);
    } else if (data.sell) {
      await this.config.executor.SellAll(data.price, data.time);
    }
  }
}

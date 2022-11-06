import tulind from 'tulind';
import { IOHLCV, ITimeClose } from '../../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '..';
import { ISnapshot } from '../../../common/snapshot';
import { ITransaction } from '../../../common/transaction';

export
interface IParams {
  rsi_size: number,
  k_size: number,
  d_size: number,
  stoch_size: number,
  stop_rate: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
  k?: number;
  d?: number;
  diff?: number;
}

export
class SRSI_Martin
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private srsi(close: number[], options: {
    rsi_size: number,
    k_size: number,
    d_size: number,
    stoch_size: number,
  }) {
    let rsi: number[] = [];
    tulind.indicators.rsi.indicator(
      [close],
      [options.rsi_size],
      (error: any, data: any) => {
        if (error) throw error;
        rsi = data[0];
      },
    );
    let k: number[] = [];
    let d: number[] = [];
    tulind.indicators.stoch.indicator(
      [rsi, rsi, rsi],
      [options.stoch_size, options.k_size, options.d_size],
      (error: any, data: any) => {
        if (error) throw error;
        k = data[0];
        d = data[1];
      },
    );
    const diff = k.map((num, index) => num - d[index]);
    const fill_num = close.length - k.length;
    return {
      k: Array(fill_num).fill(null).concat(k),
      d: Array(fill_num).fill(null).concat(d),
      diff: Array(fill_num).fill(null).concat(diff),
    };
  }

  private srsi_start(options: {
    rsi_size: number,
    k_size: number,
    d_size: number,
    stoch_size: number,
  }) {
    const rsi_start = tulind.indicators.rsi.start([options.rsi_size]);
    const stoch_start = tulind.indicators.stoch.start([options.stoch_size, options.k_size, options.d_size]);
    return rsi_start + stoch_start;
  }

  protected ready_length() {
    return this.srsi_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { k, d, diff } = this.srsi(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      signal.k = k[index];
      signal.d = d[index];
      signal.diff = diff[index];
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      if (diff_last > 0 && diff_prev <= 0) signal.buy = true;
      if (diff_last < 0 && diff_prev >= 0) signal.sell = true;
    });
  }

  private buy_tn: ITransaction | null = null;

  private queue: number[] = [];

  private queue_append(close: number) {
    this.queue.push(close);
    const diff = this.queue.length - 24;
    if (diff > 0) this.queue.splice(0, diff);
  }

  private queue_low() {
    if (this.queue.length !== 24) return -Infinity;
    return Math.min(...this.queue);
  }

  protected async signal_action(signal: ISignal) {
    // this.queue_append(signal.low);
    if (signal.sell) {
      const sell_tn = await this.config.executor.SellAll(signal.close, signal.time);
      this.buy_tn = null;
      return sell_tn;
    } else if (signal.buy) {
      this.game_open();
      this.buy_tn = await this.config.executor.BuyAll(signal.close, signal.time);
      return this.buy_tn;
    }
  }

  protected override async stop_signal_action(signal: ITimeClose, lagging?: boolean) {
    if (this.buy_tn) {
      const target_rate = 1 - this.config.params.stop_rate;
      const current_rate = signal.close / this.buy_tn.price;
      if (current_rate < target_rate) {
        const sell_tn = await this.config.executor.SellAll(
          lagging ? this.buy_tn.price * target_rate : signal.close,
          signal.time,
        );
        this.buy_tn = null;
        return sell_tn;
      }
    }
  }
}

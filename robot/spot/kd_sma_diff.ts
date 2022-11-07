import tulind from 'tulind';
import { IOHLCV } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';

export
interface IParams {
  fast_size: number;
  slow_size: number;
  k_size: number;
  d_size: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
  fast?: number;
  slow?: number;
  k?: number;
  d?: number;
  diff?: number;
}

export
class KD_SMA_DIFF
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private kd_sma_diff(close: number[], options: {
    fast_size: number;
    slow_size: number;
    k_size: number;
    d_size: number;
  }) {
    let fast_line: number[] = [];
    const fast_start = tulind.indicators.sma.start([options.fast_size]);
    tulind.indicators.sma.indicator(
      [close],
      [options.fast_size],
      (error: any, data: any) => {
        if (error) throw error;
        fast_line = data[0];
      },
    );
    fast_line = Array(fast_start).fill(null).concat(fast_line);

    let slow_line: number[] = [];
    const slow_start = tulind.indicators.sma.start([options.slow_size]);
    tulind.indicators.sma.indicator(
      [close],
      [options.slow_size],
      (error: any, data: any) => {
        if (error) throw error;
        slow_line = data[0];
      },
    );
    slow_line = Array(slow_start).fill(null).concat(slow_line);

    let sma_diff = fast_line.map((item, index) => item - slow_line[index]);
    sma_diff = sma_diff.slice(slow_start);

    let k: number[] = [];
    const k_start = tulind.indicators.sma.start([options.k_size]);
    tulind.indicators.sma.indicator(
      [sma_diff],
      [options.k_size],
      (error: any, data: any) => {
        if (error) throw error;
        k = data[0];
      },
    );

    let d: number[] = [];
    const d_start = tulind.indicators.sma.start([options.d_size]);
    tulind.indicators.sma.indicator(
      [k],
      [options.d_size],
      (error: any, data: any) => {
        if (error) throw error;
        d = data[0];
      },
    );

    k = Array(slow_start + k_start).fill(null).concat(k);
    d = Array(slow_start + k_start + d_start).fill(null).concat(d);
    const diff = k.map((item, index) => item - d[index]);
    return { fast_line, slow_line, sma_diff, k, d, diff };
  }

  private kd_sma_diff_start(options: {
    fast_size: number;
    slow_size: number;
    k_size: number;
    d_size: number;
  }) {
    const slow_start = tulind.indicators.sma.start([options.slow_size]);
    const k_start = tulind.indicators.sma.start([options.k_size]);
    const d_start = tulind.indicators.sma.start([options.d_size]);
    return slow_start + k_start + d_start;
  }

  protected ready_length() {
    return this.kd_sma_diff_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { diff } = this.kd_sma_diff(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      signal.diff = diff[index];
      if (diff_last > 0 && diff_prev <= 0) signal.buy = true;
      if (diff_last < 0 && diff_prev >= 0) signal.sell = true;
    });
  }

  protected async signal_action(signal: ISignal) {
    if (signal.sell) {
      return await this.config.executor.SellAll(signal.close, signal.time);
    } else if (signal.buy) {
      this.game_open();
      return await this.config.executor.BuyAll(signal.close, signal.time);
    }
  }
}

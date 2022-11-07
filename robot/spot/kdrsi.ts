import tulind from 'tulind';
import { IOHLCV } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';

export
interface IParams {
  rsi_size: number;
  k_size: number;
  d_size: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
  rsi?: number;
  k?: number;
  d?: number;
  diff?: number;
}

export
class KDRSI
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private kdrsi(close: number[], options: {
    rsi_size: number,
    k_size: number,
    d_size: number,
  }) {
    let rsi: number[] = [];
    const rsi_start = tulind.indicators.rsi.start([options.rsi_size]);
    tulind.indicators.rsi.indicator(
      [close],
      [options.rsi_size],
      (error: any, data: any) => {
        if (error) throw error;
        rsi = data[0];
      },
    );
    let k: number[] = [];
    const k_start = tulind.indicators.sma.start([options.k_size]);
    tulind.indicators.sma.indicator(
      [rsi],
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
    rsi = Array(rsi_start).fill(null).concat(rsi);
    k = Array(rsi_start + k_start).fill(null).concat(k);
    d = Array(rsi_start + k_start + d_start).fill(null).concat(d);
    const diff = k.map((item, index) => item - d[index]);
    return { rsi, k, d, diff };
  }

  private kdrsi_start(options: {
    rsi_size: number,
    k_size: number,
    d_size: number,
  }) {
    const rsi_start = tulind.indicators.rsi.start([options.rsi_size]);
    const k_start = tulind.indicators.sma.start([options.k_size]);
    const d_start = tulind.indicators.sma.start([options.d_size]);
    return rsi_start + k_start + d_start;
  }

  protected ready_length() {
    return this.kdrsi_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { rsi, k, d, diff } = this.kdrsi(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      signal.rsi = rsi[index];
      signal.k = k[index];
      signal.d = d[index];
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

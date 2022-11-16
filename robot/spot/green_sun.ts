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
  diff?: number;
}

export
class GreenSun
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private double_sma(close: number[], options: { fast_size: number; slow_size: number; }) {
    let fast_line: number[] = [];
    tulind.indicators.sma.indicator([close], [options.fast_size], (error: any, data: any) => {
      if (error) throw error;
      fast_line = Array(tulind.indicators.sma.start([options.fast_size])).fill(null).concat(data[0]);
    });
    let slow_line: number[] = [];
    tulind.indicators.sma.indicator([close], [options.slow_size], (error: any, data: any) => {
      if (error) throw error;
      slow_line = Array(tulind.indicators.sma.start([options.slow_size])).fill(null).concat(data[0]);
    });
    const diff = fast_line.map((fast, index) => fast - slow_line[index]);
    return { fast_line, slow_line, diff };
  }

  private double_sma_start(options: { fast_size: number; slow_size: number; }) {
    return tulind.indicators.sma.start([options.slow_size]);
  }

  protected ready_length() {
    return this.double_sma_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { fast_line, slow_line, diff } = this.double_sma(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      // signal.fast_ma = fast_line[index];
      // signal.slow_ma = slow_line[index];
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

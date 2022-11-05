import tulind from 'tulind';
import { IOHLCV } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';

export
interface IParams {
  kama_period: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
  kama?: number;
  diff?: number;
}

export
class KamaSingle
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private kama(close: number[], options: { kama_period: number }) {
    let kama_line: number[] = [];
    tulind.indicators.kama.indicator(
      [close],
      [options.kama_period],
      (error: any, data: any) => {
        if (error) throw error;
        kama_line = Array(this.kama_start(options)).fill(null).concat(data[0]);
      },
    );
    const diff = kama_line.map((item, index) => item - close[index]);
    return { kama_line, diff };
  }

  private kama_start(options: { kama_period: number; }) {
    return tulind.indicators.kama.start([options.kama_period]);
  }

  protected ready_length() {
    return this.kama_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { kama_line, diff } = this.kama(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      signal.kama = kama_line[index];
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

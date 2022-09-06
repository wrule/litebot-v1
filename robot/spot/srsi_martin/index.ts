import tulind from 'tulind';
import { IOHLCV } from '../../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '..';

export
interface IParams {
  rsi_size: number,
  k_size: number,
  d_size: number,
  stoch_size: number,
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class SRSI_Martin
extends SpotRobot<IParams, IOHLCV, ISignal> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal>) {
    super(config);
  }

  private srsi(data: number[], options: {
    rsi_size: number,
    k_size: number,
    d_size: number,
    stoch_size: number,
  }) {
    let rsi: number[] = [];
    tulind.indicators.rsi.indicator(
      [data],
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
    const fill_num = data.length - k.length;
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

  public ready_length() {
    return this.srsi_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((history) => history.close);
    const { diff } = this.srsi(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = diff[index];
      const diff_prev = diff[index - 1];
      if (diff_last > 0 && diff_prev <= 0) signal.buy = true;
      if (diff_last < 0 && diff_prev >= 0) signal.sell = true;
    });
  }

  protected async signal_action(signal: ISignal) {
    if (signal.sell) {
      return await this.config.executor.SellAll(signal.close);
    } else if (signal.buy) {
      return await this.config.executor.BuyAll(signal.close);
    }
  }
}

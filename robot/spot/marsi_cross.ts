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
  diff?: number;
}

export
class MARSI_Cross
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
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
      signal.fast_ma = fast_line[index];
      signal.slow_ma = slow_line[index];
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

import tulind from 'tulind';
import { IOHLCV, ITimeClose } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';
import moment from 'moment';

export
interface IParams {
  fast: number;
  slow: number;
  smooth: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
  diff?: number;
}

export
class MACD
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
  }

  private macd(
    source: number[],
    params: {
      fast: number;
      slow: number;
      smooth: number;
    },
  ) {
    console.log(tulind.indicators.macd);
    let result: number[][] = [];
    tulind.indicators.macd.indicator(
      [source],
      [params.fast, params.slow, params.smooth],
      (error: any, data: any) => {
        if (error) throw error;
        result = data;
      },
    );
    return { dif: result[0], dea: result[1], macd: result[2] };
  }

  private macd_start() {

  }

  protected ready_length() {
    return 0;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const close = historical_data.map((item) => item.close);
    const { macd } = this.macd(close, this.config.params);
    return this.fill_signal_data(historical_data, (signal, index) => {
      const diff_last = macd[index];
      const diff_prev = macd[index - 1];
      signal.diff = macd[index];
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

  protected override async stop_signal_action(signal: ITimeClose, lagging?: boolean) {
    // console.log('信号:', signal.close);
  }
}

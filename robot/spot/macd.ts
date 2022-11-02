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
    let result: number[][] = [];
    tulind.indicators.macd.indicator(
      [source],
      [params.fast, params.slow, params.smooth],
      (error: any, data: any) => {
        if (error) throw error;
        result = data;
      },
    );
    const left_fill = Array(this.macd_start(params)).fill(null);
    return {
      dif: left_fill.concat(result[0]),
      dea: left_fill.concat(result[1]),
      macd: left_fill.concat(result[2]),
    };
  }

  private macd_start(
    params: {
      fast: number;
      slow: number;
      smooth: number;
    },
  ): number {
    return tulind.indicators.macd.start([params.fast, params.slow, params.smooth]);
  }

  protected ready_length() {
    return this.macd_start(this.config.params) + 2;
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

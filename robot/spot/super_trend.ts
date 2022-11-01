import tulind from 'tulind';
import { IOHLCV, ITimeClose } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';

export
interface IParams {
  atr_period: number;
  atr_multiplier: number;
}

export
interface ISignal
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class SuperTrend
extends SpotRobot<IParams, IOHLCV, ISignal, ISnapshot> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ISignal, ISnapshot>) {
    super(config);
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
    let result: number[] = [];
    const start = this.atr_start(params);
    const options = [params.atr_period];
    tulind.indicators.atr.indicator(
      [high, low, close],
      options,
      (error: any, data: any) => {
        if (error) throw error;
        result = Array(start).fill(null).concat(data[0]);
      },
    );
    return result;
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
    return 0;
    // return this.double_sma_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const hl2 = historical_data.map((history) => (history.high + history.low) / 2);
    const atr = this.atr(
      historical_data.map((history) => history.high),
      historical_data.map((history) => history.low),
      historical_data.map((history) => history.close),
      this.config.params,
    );
    const close_r1: (number | null)[] = historical_data.map((history) => history.close);
    close_r1.pop() && close_r1.unshift(null);

    const atr_down_r1 = hl2.map((item, index) => atr[index] != null ? item - atr[index] * this.config.params.atr_multiplier : null);
    atr_down_r1.pop() && atr_down_r1.unshift(null);
    let atr_down_max = -Infinity;
    const down_border = atr_down_r1.map((item, index) => {
      const close = close_r1[index];
      if (item == null || close == null) return null;
      let new_item = atr_down_max;
      if (item > atr_down_max) atr_down_max = new_item = item;
      if (close < new_item) atr_down_max = -Infinity;
      return new_item;
    });
    console.log(down_border.slice(down_border.length - 40));

    const atr_up_r1 = hl2.map((item, index) => atr[index] != null ? item + atr[index] * this.config.params.atr_multiplier : null);
    atr_up_r1.pop() && atr_up_r1.unshift(null);
    let atr_up_min = Infinity;
    const up_border = atr_up_r1.map((item, index) => {
      const close = close_r1[index];
      if (item == null || close == null) return null;
      let new_item = atr_up_min;
      if (item < atr_up_min) atr_up_min = new_item = item;
      if (close > new_item) atr_up_min = Infinity;
      return new_item;
    });
    console.log(up_border.slice(up_border.length - 40));

    return [];
    // const close = historical_data.map((history) => history.close);
    // const { fast_line, slow_line, diff } = this.double_sma(close, this.config.params);
    // return this.fill_signal_data(historical_data, (signal, index) => {
    //   const diff_last = diff[index];
    //   const diff_prev = diff[index - 1];
    //   signal.fast_ma = fast_line[index];
    //   signal.slow_ma = slow_line[index];
    //   signal.diff = diff[index];
    //   if (diff_last > 0 && diff_prev <= 0) signal.buy = true;
    //   if (diff_last < 0 && diff_prev >= 0) signal.sell = true;
    // });
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

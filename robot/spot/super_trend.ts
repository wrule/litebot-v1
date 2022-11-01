import tulind from 'tulind';
import { IOHLCV, ITimeClose } from '../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '.';
import { ISnapshot } from '@/common/snapshot';
import moment from 'moment';

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

  /**
   * ATR起始索引计算
   * @param params
   * @returns ATR起始索引
   */
  private atr_start(params: { atr_period: number }): number {
    return tulind.indicators.atr.start([params.atr_period]);
  }

  /**
   * ATR指标包装
   * @param high
   * @param low
   * @param close
   * @param params
   * @returns 左补全的ATR
   */
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

  /**
   * 超级趋势通道
   * @param source 数据源
   * @param high
   * @param low
   * @param close
   * @returns 通道数据
   */
  private super_trend_channel(
    source: number[],
    high: number[],
    low: number[],
    close: number[],
  ) {
    const atr = this.atr(high, low, close, this.config.params);
    const close_r1: (number | null)[] = close.slice();
    close_r1.pop() && close_r1.unshift(null);

    const atr_down_r1 = source.map((item, index) => atr[index] != null ? item - atr[index] * this.config.params.atr_multiplier : null);
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

    const atr_up_r1 = source.map((item, index) => atr[index] != null ? item + atr[index] * this.config.params.atr_multiplier : null);
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

    return { up_border, down_border };
  }

  protected ready_length() {
    return this.atr_start(this.config.params) + 2;
  }

  protected generate_signal_data(historical_data: IOHLCV[]): ISignal[] {
    const hl2 = historical_data.map((history) => (history.high + history.low) / 2);
    const high = historical_data.map((history) => history.high);
    const low = historical_data.map((history) => history.low);
    const close = historical_data.map((history) => history.close);

    const { up_border, down_border } = this.super_trend_channel(hl2, high, low, close);

    const show = Array(20).fill(0).map((_, index) => {
      const current_index = historical_data.length - 1 - index;
      const close = historical_data[current_index].close;
      const time = moment(new Date(historical_data[current_index].time)).format('YYYY-MM-DD HH:mm:ss');
      const up_n = up_border[current_index];
      const down_n = down_border[current_index];
      return [time, up_n, close, down_n];
    }).reverse();
    console.log(show);
    return [];

    // let holding: boolean | null = null;
    // return this.fill_signal_data(historical_data, (signal, index) => {
    //   const up = up_border[index] as number;
    //   const down = down_border[index] as number;
    //   if (signal.close > up && (holding === false || holding == null)) {
    //     signal.buy = true;
    //     holding = true;
    //   }
    //   if (signal.close < down && (holding === true || holding == null)) {
    //     signal.sell = true;
    //     holding = false;
    //   }
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

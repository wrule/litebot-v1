const tulind = require('tulind');
import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { ISpotRobotConfig, SpotRobot } from '..';
import moment from 'moment';
import { INotifier } from '@/notifier';
import { ITransaction } from '@/common/transaction';
import { Report } from '@/report';

export
interface IParams {
  rsi_size: number,
  k_size: number,
  d_size: number,
  stoch_size: number,
}

export
interface ITestData
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class SRSI_Martin
extends SpotRobot<IParams, IOHLCV, ITestData> {
  public constructor(config: ISpotRobotConfig<IParams, IOHLCV, ITestData>) {
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

  //#region 实盘运行接口实现
  protected async checkKLine(confirmed_kline: KLine, last_confirmed: IOHLCV) { }
  //#endregion

  //#region 回测运行接口实现
  public GenerateTestData(kline: IOHLCV[]): ITestData[] {
    const { diff } = this.srsi(kline.map((item) => item.close), this.config.params);
    return kline.map((item, index) => {
      const result: ITestData = { ...item };
      if (index >= this.KLineReadyIndex) {
        const diff_last = diff[index];
        const diff_prev = diff[index - 1];
        if (diff_last > 0 && diff_prev <= 0) result.buy = true;
        if (diff_last < 0 && diff_prev >= 0) result.sell = true;
      }
      return result;
    });
  }

  protected async checkTestData(data: ITestData) {
    if (data.buy) {
      await this.config.executor.BuyAll(data.close, data.time);
    } else if (data.sell) {
      await this.config.executor.SellAll(data.close, data.time);
    }
  }
  //#endregion
}

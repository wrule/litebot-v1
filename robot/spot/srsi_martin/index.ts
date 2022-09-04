import moment from 'moment';
const tulind = require('tulind');
import { IOHLCV, KLine } from '../../../common/kline';
import { ISpotRobotConfig, SpotRobot } from '..';
import { ITransaction } from '../../../common/transaction';

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

  private message(tn: ITransaction, prev_diff: number, last_diff: number) {
    this.SendMessage(`[${
      moment(new Date(tn.transaction_time)).format('HH:mm:ss')
    }  ${
      { 'BUY': '买', 'SELL': '卖' }[tn.action as string]
    }  ${
      `${tn.in_amount}${tn.in_name} =(${tn.price})=> ${tn.out_amount}${tn.out_name}`
    }]\n前差: ${prev_diff}  现差: ${last_diff}\n走单耗时: ${(tn.transaction_time - tn.request_time) / 1000}秒`);
  }

  public get KLineReadyLength() {
    return this.srsi_start(this.config.params) + 1;
  }

  //#region 实盘运行接口实现
  protected async checkKLine(confirmed_kline: KLine, last_confirmed: IOHLCV) {
    try {
      const data = this.GenerateTestData(confirmed_kline);
      const last = data[data.length - 1];
      if (last.sell) {
        const tn = await this.config.executor.SellAll(last_confirmed.close);
        this.message(tn, 0, 0);
      } else if (last.buy) {
        const tn = await this.config.executor.BuyAll(last_confirmed.close);
        this.message(tn, 0, 0);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
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
    if (data.sell) {
      await this.config.executor.SellAll(data.close, data.time);
    } else if (data.buy) {
      await this.config.executor.BuyAll(data.close, data.time);
    }
  }
  //#endregion
}

const tulind = require('tulind');
import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';
import moment from 'moment';
import { INotifier } from '@/notifier';
import { ITransaction } from '@/common/transaction';
import { Report } from '@/report';

export
interface IParams {
  fast_ma: number;
  slow_ma: number;
}

export
interface ITestData
extends IOHLCV {
  buy?: boolean;
  sell?: boolean;
}

export
class TwoMaCross
extends SpotRobot<IParams, IOHLCV, ITestData> {
  public constructor(
    protected readonly params: IParams,
    protected readonly executor: ISpotExecutor,
    protected report?: Report<IParams, IOHLCV, ITestData>,
    notifier?: INotifier,
  ) {
    super(params, executor, report, notifier);
  }

  private sma(closes: number[], size: number) {
    let result: number[] = [];
    tulind.indicators.sma.indicator(
      [closes],
      [size],
      (error: any, data: any) => {
        if (error) {
          throw error;
        }
        result = Array(size - 1).fill(null).concat(data[0]);
      },
    );
    return result;
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
    return Math.max(this.params.fast_ma, this.params.slow_ma) + 1;
  }

  //#region 实盘运行接口实现
  protected async checkKLine(confirmed_kline: KLine, last_confirmed: IOHLCV) {
    try {
      const closes = confirmed_kline.map((item) => item.close);
      const fast_line = this.sma(closes, this.params.fast_ma);
      const slow_line = this.sma(closes, this.params.slow_ma);
      const prev_diff = fast_line[fast_line.length - 2] - slow_line[slow_line.length - 2];
      const last_diff = fast_line[fast_line.length - 1] - slow_line[slow_line.length - 1];
      this.logger.log(
        '时间', moment(new Date(last_confirmed.time)).format('YYYY-MM-DD HH:mm:ss'),
        '前差', prev_diff,
        '现差', last_diff,
      );
      if (this.gold_cross_line(fast_line, slow_line)) {
        const tn = await this.executor.BuyAll(last_confirmed.close);
        this.message(tn, prev_diff, last_diff);
      } else if (this.dead_cross_line(fast_line, slow_line)) {
        const tn = await this.executor.SellAll(last_confirmed.close);
        this.message(tn, prev_diff, last_diff);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
  //#endregion

  //#region 回测运行接口实现
  public GenerateTestData(kline: KLine): ITestData[] {
    const closes = kline.map((item) => item.close);
    const fast_line = this.sma(closes, this.params.fast_ma);
    const slow_line = this.sma(closes, this.params.slow_ma);
    return kline.map((item, index) => {
      const result: ITestData = { ...item };
      if (index >= this.KLineReadyIndex) {
        const fast_last = fast_line[index], slow_last = slow_line[index];
        const fast_prev = fast_line[index - 1], slow_prev = slow_line[index - 1];
        if (this.gold_cross(fast_prev, slow_prev, fast_last, slow_last)) {
          result.buy = true;
        } else if (this.dead_cross(fast_prev, slow_prev, fast_last, slow_last)) {
          result.sell = true;
        }
      }
      return result;
    });
  }

  protected async checkTestData(data: ITestData) {
    if (data.buy) {
      await this.executor.BuyAll(data.close, data.time);
    } else if (data.sell) {
      await this.executor.SellAll(data.close, data.time);
    }
  }
  //#endregion
}

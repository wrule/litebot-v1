const tulind = require('tulind');
import { IOHLCV, KLine } from '@/common/kline';
import { ISpotExecutor } from '@/executor/spot';
import { SpotRobot } from '.';
import moment from 'moment';
import { INotifier } from '@/notifier';

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
    notifier?: INotifier,
  ) {
    super(params, executor, notifier);
  }

  public sma(closes: number[], size: number) {
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

  public get KLineReadyLength() {
    return Math.max(this.params.fast_ma, this.params.slow_ma) + 2;
  }

  protected async checkKLine(
    confirmed_kline: KLine,
    last: IOHLCV,
    kline: KLine,
  ) {
    const closes = confirmed_kline.map((item) => item.close);
    const fast_line = this.sma(closes, this.params.fast_ma);
    const slow_line = this.sma(closes, this.params.slow_ma);
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    console.log(
      moment().format('YYYY-MM-DD HH:mm:ss'),
      '前均线差', fast_prev - slow_prev,
      '现均线差', fast_last - slow_last,
    );
    if (this.gold_cross_line(fast_line, slow_line)) {
      const tn = await this.BuyAll(last.close, Number(new Date()));
      if (tn) {
        this.SendMessage(`[买 价格 ${tn.price}] ${
          moment(new Date(tn.transaction_time)).format('HH:mm:ss')
        }:\n使用 ${
          tn.in_amount
        } 个 ${
          tn.in_name
        } 买了 ${
          tn.out_amount
        } 个 ${
          tn.out_name
        }`);
      }
    } else if (this.dead_cross_line(fast_line, slow_line)) {
      const tn = await this.SellAll(last.close, Number(new Date()));
      if (tn) {
        this.SendMessage(`[卖 价格 ${tn.price}] ${
          moment(new Date(tn.transaction_time)).format('HH:mm:ss')
        }:\n使用 ${
          tn.in_amount
        } 个 ${
          tn.in_name
        } 卖了 ${
          tn.out_amount
        } 个 ${
          tn.out_name
        }`);
      }
    }
  }

  protected generateTestData(
    params: IParams,
    kline: KLine,
  ): ITestData[] {
    const closes = kline.map((item) => item.close);
    const fast_line = this.sma(closes, params.fast_ma);
    const slow_line = this.sma(closes, params.slow_ma);
    const effective_index = Math.max(params.fast_ma, params.slow_ma);
    return kline.map((item, index) => {
      const result: ITestData = { ...item };
      if (index >= effective_index) {
        const fast_last = fast_line[index];
        const slow_last = slow_line[index];
        const fast_prev = fast_line[index - 1];
        const slow_prev = slow_line[index - 1];
        if (this.gold_cross(fast_prev, slow_prev, fast_last, slow_last)) {
          result.buy = true;
        } else if (this.dead_cross(fast_prev, slow_prev, fast_last, slow_last)) {
          result.sell = true;
        }
      }
      return result;
    });
  }

  protected checkTestData(data: ITestData) {
    if (data.buy) {
      this.BuyAll(data.close, data.time);
    } else if (data.sell) {
      this.SellAll(data.close, data.time);
    }
  }
}

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
  fast_size: number;
  slow_size: number;
  smoothing_size: number;
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

  private srsi(close: number[]) {
    let rsi: number[] = [];
    tulind.indicators.rsi.indicator(
      [close],
      [27],
      (error: any, data: any) => {
        if (error) {
          throw error;
        }
        rsi = data[0];
      },
    );
    console.log(rsi.length);
    console.log(tulind.indicators.stoch);
    let k: number[] = [];
    let d: number[] = [];
    tulind.indicators.stoch.indicator(
      [rsi, rsi, rsi,],
      [4, 33, 21],
      (error: any, data: any) => {
        if (error) {
          throw error;
        }
        k = data[0];
        d = data[1];
      },
    );
    console.log(k.slice(k.length - 15));
    console.log(d.slice(d.length - 15));
    // console.log(d.length);
  }

  //#region 实盘运行接口实现
  //#endregion

  //#region 回测运行接口实现
  public GenerateTestData(real_data: IOHLCV[]): ITestData[] {
    const last = real_data[real_data.length - 1];
    console.log(moment(new Date(last.time)).format('YYYY-MM-DD HH:mm:ss'));
    this.srsi(real_data.map((item) => item.close));
    return [];
  }
  //#endregion
}

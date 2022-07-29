import { IOHLCV } from '@/common/kline';
import { ITransaction } from '@/common/transaction';
import { ISnapshot } from '@/executor/spot';
import { IList } from '@/utils/list';

export
interface IReport<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  name?: string;
  start_time?: number;
  end_time?: number;
  real_data?: RealData[];
  test_data?: TestData[];
  params?: Params;
  transactions?: ITransaction[];
  snapshots?: ISnapshot[];
  last: ISnapshot;
}

export
class Report<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  public constructor(
    private readonly data: IReport<Params, RealData, TestData>,
  ) { }

  public get Name() {
    return this.data.name || '';
  }

  public get StartTime() {
    return this.data.start_time;
  }

  public get EndTime() {
    return this.data.end_time;
  }

  public get Data() {
    return this.data;
  }

  public get RealData() {
    return this.data.real_data || [];
  }

  public get TestData() {
    return this.data.test_data || [];
  }

  public get Params() {
    return this.data.params;
  }

  public get Transactions() {
    return this.data.transactions || [];
  }

  public get Snapshots() {
    return this.data.snapshots || [];
  }

  public get Last() {
    return this.data.last;
  }
}

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
class Report {
  public constructor(
    private readonly transactions: IList<ITransaction>,
    private readonly snapshots: IList<ISnapshot>,
  ) { }

  public get Transactions() {
    return this.transactions;
  }

  public get Snapshots() {
    return this.snapshots;
  }
}

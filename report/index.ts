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
}

export
class Report<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  public constructor(
    private readonly real_data: IList<RealData>,
    private readonly test_data: IList<TestData>,
    private readonly transactions: IList<ITransaction>,
    private readonly snapshots: IList<ISnapshot>,
  ) { }
}

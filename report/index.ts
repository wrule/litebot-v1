import { IOHLCV } from '@/common/kline';
import { ITransaction } from '@/common/transaction';
import { ISnapshot } from '@/executor/spot';
import { IList } from '@/utils/list';

export
interface IReportMeta<Params> {
  name?: string;
  start_time?: number;
  end_time?: number;
  params?: Params;
}

export
class Report<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  public constructor(
    private readonly config?: {
      meta?: IList<IReportMeta<Params>>,
      real_data?: IList<RealData>,
      test_data?: IList<TestData>,
      transactions?: IList<ITransaction>,
      snapshots?: IList<ISnapshot>,
    },
  ) { }

  public async AppendRealData(data: RealData) {
    await this.config?.real_data?.Append(data);
  }

  public async AppendTestData(data: TestData) {
    await this.config?.test_data?.Append(data);
  }

  public async AppendTransaction(transaction: ITransaction) {
    await this.config?.transactions?.Append(transaction);
  }

  public async AppendSnapshot(snapshot: ISnapshot) {
    await this.config?.snapshots?.Append(snapshot);
  }
}

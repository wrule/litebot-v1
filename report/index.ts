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
  last: ISnapshot;
}

export
class Report<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  public constructor(
    private readonly config: {
      meta_data: IList<IReportMeta<Params>>,
      real_data?: IList<RealData>,
      test_data?: IList<TestData>,
      transactions?: IList<ITransaction>,
      snapshots?: IList<ISnapshot>,
    },
  ) { }

  public async Meta() {
    return ((await this.config.meta_data.GetFirst()) || { }) as IReportMeta<Params>;
  }

  public async Last() {
    return (await this.Meta()).last;
  }

  public async UpdateMeta(meta: IReportMeta<Params>) {
    await this.config.meta_data.UpdateFirst({
      ...(await this.Meta()),
      ...meta,
    });
  }

  public async RealData() {
    return await this.config.real_data?.All() || [];
  }

  public async AppendRealData(data: RealData) {
    await this.config.real_data?.Append(data);
  }

  public async TestData() {
    return await this.config.test_data?.All() || [];
  }

  public async AppendTestData(data: TestData) {
    await this.config.test_data?.Append(data);
  }

  public async Transactions() {
    return await this.config.transactions?.All() || [];
  }

  public async AppendTransaction(transaction: ITransaction) {
    await this.config.transactions?.Append(transaction);
  }

  public async Snapshots() {
    return await this.config.snapshots?.All() || [];
  }

  public async AppendSnapshot(snapshot: ISnapshot) {
    await this.config.snapshots?.Append(snapshot);
  }
}

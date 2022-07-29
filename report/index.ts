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
      meta_data?: IList<IReportMeta<Params>>,
      real_data?: IList<RealData>,
      test_data?: IList<TestData>,
      transactions?: IList<ITransaction>,
      snapshots?: IList<ISnapshot>,
    },
  ) { }

  public async Meta() {
    return (await this.config?.meta_data?.GetFirst()) || null;
  }

  public async UpdateMeta(meta: IReportMeta<Params>) {
    const meta_data = this.config?.meta_data;
    if (meta_data) {
      const old_meta = await meta_data.GetFirst() || { };
      await meta_data.UpdateFirst({
        ...old_meta,
        ...meta,
      });
    }
  }

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

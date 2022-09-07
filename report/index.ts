import { IOHLCV } from '@/common/kline';
import { ISnapshot } from '@/common/snapshot';
import { ITransaction } from '@/common/transaction';
import { ILogList } from '@/utils/log_list';

export
interface IReportMeta<Params> {
  name?: string;
  robot_name?: string;
  start_time?: number;
  end_time?: number;
  params?: Params;
  last?: ISnapshot;
}

export
class Report<Params, RealData, TestData> {
  public constructor(
    private readonly config?: {
      meta_data?: ILogList<IReportMeta<Params>>,
      real_data?: ILogList<RealData>,
      test_data?: ILogList<TestData>,
      transactions?: ILogList<ITransaction>,
      snapshots?: ILogList<ISnapshot>,
    },
  ) { }

  public async Meta() {
    return ((await this.config?.meta_data?.GetFirst()) || { }) as IReportMeta<Params>;
  }

  public async Last() {
    return (await this.Meta()).last as ISnapshot;
  }

  public async UpdateMeta(meta: IReportMeta<Params>) {
    await this.config?.meta_data?.SetFirst({
      ...(await this.Meta()),
      ...meta,
    });
  }

  public async Reset() {
    await Promise.all([
      this.config?.meta_data?.Empty(),
      this.config?.real_data?.Empty(),
      this.config?.test_data?.Empty(),
      this.config?.transactions?.Empty(),
      this.config?.snapshots?.Empty(),
    ]);
  }

  public async RealData() {
    return await this.config?.real_data?.All() || [];
  }

  public async AppendRealData(...data: RealData[]) {
    await this.config?.real_data?.Append(...data);
  }

  public async TestData() {
    return await this.config?.test_data?.All() || [];
  }

  public async AppendTestData(...data: TestData[]) {
    await this.config?.test_data?.Append(...data);
  }

  public async Transactions() {
    return await this.config?.transactions?.All() || [];
  }

  public async AppendTransaction(...transactions: ITransaction[]) {
    await this.config?.transactions?.Append(...transactions);
  }

  public async Snapshots() {
    return await this.config?.snapshots?.All() || [];
  }

  public async AppendSnapshot(...snapshots: ISnapshot[]) {
    await this.config?.snapshots?.Append(...snapshots);
  }
}

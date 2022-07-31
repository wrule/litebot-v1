import { IOHLCV } from '@/common/kline';
import { ITransaction } from '@/common/transaction';
import { ISnapshot } from '@/executor/spot';
import { MemoryList } from '@/utils/list/memory_list';
import { IReportMeta, Report } from '.';

export
class MemoryReport<Params, RealData, TestData>
extends Report<Params, RealData, TestData> {
  public constructor() {
    super({
      meta_data: new MemoryList<IReportMeta<Params>>(),
      real_data: new MemoryList<RealData>(),
      test_data: new MemoryList<TestData>(),
      transactions: new MemoryList<ITransaction>(),
      snapshots: new MemoryList<ISnapshot>(),
    });
  }
}

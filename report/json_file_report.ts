import { ITimeClose } from '../common/kline';
import { ISnapshot } from '../common/snapshot';
import { ITransaction } from '../common/transaction';
import { MemoryList } from '../utils/log_list/memory_list';
import { Report, IReportMetaData } from '.';

export
class MemoryReport<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
>
extends Report<Params, HistoricalData, SignalData, Snapshot> {
  public constructor() {
    super({
      meta_data: new MemoryList<IReportMetaData<Params, Snapshot>>(),
      historical_data: new MemoryList<HistoricalData>(),
      signal_data: new MemoryList<SignalData>(),
      transactions: new MemoryList<ITransaction>(),
      snapshots: new MemoryList<Snapshot>(),
    });
  }
}

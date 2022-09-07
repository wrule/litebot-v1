import { ITransaction } from '../common/transaction';
import { ILogList } from '../utils/log_list';
import { ITimeClose } from '../common/kline';
import { ISnapshot } from '../common/snapshot';

export
interface IReportMetaData<Params, Snapshot extends ISnapshot> {
  name?: string;
  robot_name?: string;
  start_time: number;
  end_time: number;
  params: Params;
  last_snapshot: Snapshot;
}

export
interface IReportConfig<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
> {
  meta_data: IReportMetaData<Params, Snapshot>;
  params: Params;
  historical_data?: ILogList<HistoricalData>;
  signal_data?: ILogList<SignalData>;
  transactions?: ILogList<ITransaction>;
  snapshots?: ILogList<Snapshot>;
}

export
class Report<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
> {
  public constructor(
    private config: IReportConfig<Params, HistoricalData, SignalData, Snapshot>,
  ) { }
}

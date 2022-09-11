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
  meta_data: ILogList<IReportMetaData<Params, Snapshot>>;
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

  public async GetMetaData() {
    return await this.config.meta_data.GetFirst();
  }

  public async UpdateMetaData(update_data: {
    name?: string;
    robot_name?: string;
    start_time?: number;
    end_time?: number;
    params?: Params;
    last_snapshot?: Snapshot;
  }) {
    const meta_data = ((await this.GetMetaData()) || { }) as IReportMetaData<Params, Snapshot>;
    return await this.config.meta_data.SetFirst({
      ...meta_data,
      ...update_data,
    });
  }

  public get HistoricalData() {
    return this.config.historical_data;
  }

  public get SignalData() {
    return this.config.signal_data;
  }

  public get Transactions() {
    return this.config.transactions;
  }

  public get Snapshots() {
    return this.config.snapshots;
  }

  public async Games() {
    const games: ITransaction[][] = [];
    const transactions = (await this.Transactions?.All()) || [];
    transactions.forEach((tn) => {
      const index = tn.game_id;
      if (index != null) {
        if (games[index] == null) games[index] = [];
        games[index].push(tn);
      }
    });
    return games;
  }

  public async ProfitableGames() {
    return (await this.Games())
      .filter((tns) => tns[tns.length - 1].valuation > tns[0].valuation);
  }

  public async LosingGame() {
    return (await this.Games())
      .filter((tns) => tns[tns.length - 1].valuation <= tns[0].valuation);
  }

  public async WinRate() {
    const games_length = (await this.Games()).length;
    if (games_length === 0) return 0;
    return (await this.ProfitableGames()).length / games_length;
  }
}

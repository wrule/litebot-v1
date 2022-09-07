import fs from 'fs';
import path from 'path';
import { ITimeClose } from '../common/kline';
import { ISnapshot } from '../common/snapshot';
import { ITransaction } from '../common/transaction';
import { JSONFileList } from '../utils/log_list/json_file_list';
import { Report, IReportMetaData } from '.';

export
class JSONFileReport<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
>
extends Report<Params, HistoricalData, SignalData, Snapshot> {
  public constructor(report_dir_path: string) {
    fs.mkdirSync(report_dir_path, { recursive: true });
    super({
      meta_data: new JSONFileList<IReportMetaData<Params, Snapshot>>(path.join(report_dir_path, 'meta_data.json')),
      historical_data: new JSONFileList<HistoricalData>(path.join(report_dir_path, 'historical_data.json')),
      signal_data: new JSONFileList<SignalData>(path.join(report_dir_path, 'signal_data.json')),
      transactions: new JSONFileList<ITransaction>(path.join(report_dir_path, 'transactions.json')),
      snapshots: new JSONFileList<Snapshot>(path.join(report_dir_path, 'snapshots.json')),
    });
  }
}

import fs from 'fs';
import path from 'path';
import { IOHLCV } from '@/common/kline';
import { ITransaction } from '../common/transaction';
import { JSONList } from '../utils/list/json_list';
import { IReportMeta, Report } from '.';
import { ISnapshot } from '@/common/snapshot';

export
class JSONReport<Params, RealData, TestData>
extends Report<Params, RealData, TestData> {
  public constructor(report_path: string) {
    fs.mkdirSync(report_path, { recursive: true });
    super({
      meta_data: new JSONList<IReportMeta<Params>>(path.join(report_path, 'meta.json')),
      real_data: new JSONList<RealData>(path.join(report_path, 'real_data.json')),
      test_data: new JSONList<TestData>(path.join(report_path, 'test_data.json')),
      transactions: new JSONList<ITransaction>(path.join(report_path, 'transactions.json')),
      snapshots: new JSONList<ISnapshot>(path.join(report_path, 'snapshots.json')),
    });
  }
}

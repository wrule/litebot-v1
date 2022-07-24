import { ITransaction } from '@/common/transaction';
import { ISnapshot } from '@/executor/spot';
import { IList } from '@/utils/list';

export
class Report {
  public constructor(
    private readonly transactions: IList<ITransaction>,
    private readonly snapshots: IList<ISnapshot>,
  ) { }

  public get Transactions() {
    return this.transactions;
  }

  public get Snapshots() {
    return this.snapshots;
  }
}

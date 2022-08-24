import { ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { ISnapshot } from '../../common/snapshot';
import { IList } from '../../utils/list';
import { SymbolSplit } from '../../common/symbol';

export
interface ITestSpotConfig {
  /**
   * 交易对
   */
  symbol: string;
  /**
   * 交易手续费
   */
  fee: number;
  /**
   * 初始资金
   */
  init_funds_amount: number;
  /**
   * 初始资产（不填默认0）
   */
  init_assets_amount?: number;
  /**
   * 交易记录器
   */
  transaction_list?: IList<ITransaction>;
  /**
   * 快照记录器
   */
  snapshot_list?: IList<ISnapshot>;
}

export
class TestSpot
implements ISpotExecutor {
  public constructor(private readonly config: ITestSpotConfig) { }

  private available_funds_amount = 0;
  private available_assets_amount = 0;
  private assets_name = '';
  private funds_name = '';
  private fee_multiplier = 1;

  public async Transactions() {
    return (await this.config?.transaction_list?.All()) || [];
  }

  public async Snapshots() {
    return (await this.config?.snapshot_list?.All()) || [];
  }

  public Buy(
    in_amount: number,
    price: number,
    time: number,
  ) {
    if (in_funds <= this.funds) {
      this.funds -= in_funds;
      const out_assets = in_funds / price * this.fee_multiplier;
      this.assets += out_assets;
      const tn: ITransaction = {
        action: 'BUY',
        request_time: time,
        transaction_time: time,
        response_time: time,
        expected_price: price,
        price,
        in_name: this.fund_name,
        expected_in_amount: in_funds,
        in_amount: in_funds,
        out_name: this.asset_name,
        out_amount: out_assets,
      };
      if (this.record_transaction) {
        this.transactions.push(tn);
      }
      return tn;
    }
    throw new Error('资金不足');
  }

  public BuyAll(price: number, time: number) {
    return this.Buy(this.available_funds_amount, price, time);
  }

  public Sell(
    in_amount: number,
    price: number,
    time: number,
  ) {
    if (in_assets <= this.assets) {
      this.assets -= in_assets;
      const out_funds = in_assets * price * this.fee_multiplier;
      this.funds += out_funds;
      const tn: ITransaction = {
        action: 'SELL',
        request_time: time,
        transaction_time: time,
        response_time: time,
        expected_price: price,
        price,
        in_name: this.asset_name,
        expected_in_amount: in_assets,
        in_amount: in_assets,
        out_name: this.fund_name,
        out_amount: out_funds,
      };
      if (this.record_transaction) {
        this.transactions.push(tn);
      }
      return tn;
    }
    throw new Error('资产不足');
  }

  public SellAll(price: number, time: number) {
    return this.Sell(this.available_assets_amount, price, time);
  }

  public async Reset() {
    this.available_funds_amount = this.config.init_funds_amount;
    this.available_assets_amount = this.config.init_assets_amount || 0;
    [this.assets_name, this.funds_name] = SymbolSplit(this.config.symbol);
    this.fee_multiplier = 1 - this.config.fee;
    await Promise.all([
      this.config.transaction_list?.Empty(),
      this.config.snapshot_list?.Empty(),
    ]);
  }

  public get FundName() {
    return this.funds_name;
  }

  public get FundBalance() {
    return this.available_funds_amount;
  }

  public get AssetName() {
    return this.assets_name;
  }

  public get AssetBalance() {
    return this.available_assets_amount;
  }

  public Valuation(price: number) {
    return this.available_assets_amount * price + this.available_funds_amount;
  }

  public LatestSnapshot(): ISnapshot | Promise<ISnapshot> {
    throw new Error('Method not implemented.');
  }

  public UpdateSnapshot(): void | Promise<void> {
    throw new Error('Method not implemented.');
  }
}

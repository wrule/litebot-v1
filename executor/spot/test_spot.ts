import { ISpotExecutor } from '.';
import { ITransaction } from '@/common/transaction';

export
class TestSpot
implements ISpotExecutor {
  public constructor(
    private readonly init_funds = 100,
    private readonly fee = 0.001,
    private readonly record_transaction = false,
    private readonly fund_name = 'MONEY',
    private readonly asset_name = 'ASSET',
  ) {
    this.Reset();
  }

  private funds!: number;
  private assets!: number;
  private fee_multiplier!: number;
  private transactions!: ITransaction[];

  public Transactions() {
    return this.transactions || [];
  }

  public Buy(
    in_funds: number,
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

  public BuyAll(
    price: number,
    time: number,
  ) {
    return this.Buy(this.funds, price, time);
  }

  public Sell(
    in_assets: number,
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

  public SellAll(
    price: number,
    time: number,
  ) {
    return this.Sell(this.assets, price, time);
  }

  public Reset() {
    this.funds = this.init_funds;
    this.assets = 0;
    this.fee_multiplier = 1 - this.fee;
    this.transactions = [];
  }

  public get FundName() {
    return this.fund_name;
  }

  public FundBalance() {
    return this.funds;
  }

  public get AssetName() {
    return this.asset_name;
  }

  public AssetBalance() {
    return this.assets;
  }

  public Valuation(price: number) {
    return this.assets * price + this.funds;
  }
}

import { SymbolSplit } from '../../common/symbol';
import { binance } from 'ccxt';
import { ISnapshot, ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { Logger } from '../../utils/logger';

export
interface BinanceSpotConfig {
  client: binance;
  symbol: string;
  init_funds_amount: number;
  init_assets_amount?: number;
}

export
class BinanceSpot
implements ISpotExecutor {
  public constructor(private readonly config: BinanceSpotConfig) {
    this.available_funds_amount = this.config.init_funds_amount;
    this.available_assets_amount = this.config.init_assets_amount || 0;
    [this.assets_name, this.funds_name] = SymbolSplit(this.config.symbol);
  }

  private funds_name = '';
  private account_funds_amount = 0;
  private available_funds_amount = 0;
  private assets_name = '';
  private account_assets_amount = 0;
  private available_assets_amount = 0;

  protected logger = new Logger();

  /**
   * 同步账户信息
   */
  public async SyncAccount() {
    const balance = await this.config.client.fetchBalance();
    this.account_funds_amount = balance[this.funds_name].free;
    this.account_assets_amount = balance[this.assets_name].free;
    if (this.available_funds_amount > this.account_funds_amount) {
      this.logger.log(
        '预期资金数量', this.available_funds_amount,
        '大于',
        '账户资金数量', this.account_funds_amount,
        '将重置为账户资金数量'
      );
      this.available_funds_amount = this.account_funds_amount;
    }
    if (this.available_assets_amount > this.account_assets_amount) {
      this.logger.log(
        '预期资产数量', this.available_assets_amount,
        '大于',
        '账户资产数量', this.account_assets_amount,
        '将重置为账户资产数量'
      );
      this.available_assets_amount = this.account_assets_amount;
    }
    this.logger.log(
      '同步账户完成',
      '预期资金数量', this.available_funds_amount,
      '账户资金数量', this.account_funds_amount,
      '预期资产数量', this.available_assets_amount,
      '账户资产数量', this.account_assets_amount,
    );
  }

  public Transactions() {
    return [] as ITransaction[];
  }

  public Snapshots() {
    return [] as ISnapshot[];
  }

  public UpdateSnapshot(price: number) {
  }

  private async buy(
    in_assets: number,
    price?: number,
  ) {
    const request_time = Number(new Date());
    const order = await this.config.client.createMarketOrder(
      this.config.symbol,
      'buy',
      0,
      undefined,
      {
        quoteOrderQty: this.config.client.costToPrecision(this.config.symbol, in_assets),
      },
    );
    const response_time = Number(new Date());
    const tn: ITransaction = {
      action: 'BUY',
      request_time,
      transaction_time: order.timestamp,
      response_time,
      expected_price: price as number,
      price: order.price,
      in_name: this.funds_name,
      expected_in_amount: in_assets,
      in_amount: order.cost,
      out_name: this.assets_name,
      out_amount: order.amount - (order.fee.currency === this.assets_name ? order.fee.cost : 0),
    };
    this.available_funds_amount -= tn.in_amount;
    this.available_assets_amount += tn.out_amount;
    return tn;
  }

  public async Buy(
    in_assets: number,
    price?: number,
  ) {
    await this.SyncAccount();
    if (in_assets > this.available_funds_amount) {
      in_assets = this.available_funds_amount;
    }
    return this.buy(in_assets, price);
  }

  public async BuyAll(price?: number) {
    await this.SyncAccount();
    return await this.buy(this.available_funds_amount, price);
  }

  public async sell(
    in_assets: number,
    price?: number,
  ) {
    const request_time = Number(new Date());
    const order = await this.config.client.createMarketOrder(
      this.config.symbol,
      'sell',
      this.config.client.amountToPrecision(this.config.symbol, in_assets),
    );
    const response_time = Number(new Date());
    const tn: ITransaction = {
      action: 'SELL',
      request_time,
      transaction_time: order.timestamp,
      response_time,
      expected_price: price as number,
      price: order.price,
      in_name: this.assets_name,
      expected_in_amount: in_assets,
      in_amount: order.amount,
      out_name: this.funds_name,
      out_amount: order.cost - (order.fee.currency === this.funds_name ? order.fee.cost : 0),
    };
    this.available_assets_amount -= tn.in_amount;
    this.available_funds_amount += tn.out_amount;
    return tn;
  }

  public async Sell(
    in_assets: number,
    price?: number,
  ) {
    await this.SyncAccount();
    if (in_assets > this.available_assets_amount) {
      in_assets = this.available_assets_amount;
    }
    return this.sell(in_assets, price);
  }

  public async SellAll(price?: number) {
    await this.SyncAccount();
    return await this.sell(this.available_assets_amount, price);
  }

  public Reset() {

  }

  public get FundName() {
    return this.funds_name;
  }

  public FundBalance() {
    return this.available_funds_amount;
  }

  public get AssetName() {
    return this.assets_name;
  }

  public AssetBalance() {
    return this.available_assets_amount;
  }

  public async Valuation() {
    const ticker = await this.config.client.fetchTicker(this.config.symbol);
    return this.AssetBalance() * (ticker.close as number) + this.FundBalance();
  }
}

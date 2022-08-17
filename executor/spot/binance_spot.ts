import { JSONList } from '../../utils/list/json_list';
import cctx, { binance } from 'ccxt';
import { ISnapshot, ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { retryer } from '../../utils/retryer';
import { Logger } from '../../utils/logger';

export
interface BinanceSpotConfig {
  client: binance;
  symbol: string;
  init_funds: number;
  init_assets: number;
  retries?: number;
}

export
class BinanceSpot
implements ISpotExecutor {
  public constructor(
    private readonly config: BinanceSpotConfig,
  ) {
    this.funds_amount = this.config.init_funds;
    this.assets_amount = this.config.init_assets;
    this.assets_name = this.config.symbol.split('/')[0].trim();
    this.funds_name = this.config.symbol.split('/')[1].trim();
  }

  private funds_amount = 0;
  private funds_name = '';
  private assets_amount = 0;
  private assets_name = '';

  protected logger = new Logger();

  public async SelfCheck() {
    const balance = await this.config.client.fetchBalance();
    if (this.funds_amount > balance[this.funds_name].free) {
      this.logger.warn(
        '预期资金数量', this.funds_amount,
        '大于',
        '账户资金数量', balance[this.funds_name].free,
        '将重置为账户资金数量'
      );
      this.funds_amount = balance[this.funds_name].free;
    }
    if (balance[this.assets_name].free < this.assets_amount) {
      this.logger.warn(
        '预期资产数量', this.assets_amount,
        '大于',
        '账户资产数量', balance[this.assets_name].free,
        '将重置为账户资产数量'
      );
      this.assets_amount = balance[this.assets_name].free;
    }
  }

  public Transactions() {
    return [] as ITransaction[];
  }

  public Snapshots() {
    return [] as ISnapshot[];
  }

  public UpdateSnapshot(price: number) {
  }

  public async buy(
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
    return tn;
  }

  public async Buy(
    in_assets: number,
    price?: number,
  ) {
    return await retryer(
      async () => {
        return await this.buy(in_assets, price);
      },
      this.config.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public async buy_all(price?: number) {
    return await this.buy(await this.FundBalance(), price);
  }

  public async BuyAll(price?: number) {
    return await retryer(
      async () => {
        return await this.buy_all(price);
      },
      this.config.retries,
      (error) => error instanceof cctx.NetworkError,
    );
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
    return tn;
  }

  public async Sell(
    in_assets: number,
    price?: number,
  ) {
    return await retryer(
      async () => {
        return await this.sell(in_assets, price);
      },
      this.config.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public async sell_all(price?: number) {
    return await this.sell(await this.AssetBalance(), price);
  }

  public async SellAll(price?: number) {
    return await retryer(
      async () => {
        return await this.sell_all(price);
      },
      this.config.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public Reset() {

  }

  private async fetchBalance(name: string) {
    const balance = await this.config.client.fetchBalance();
    return balance[name].free;
  }

  public get FundName() {
    return this.funds_name;
  }

  public async FundBalance() {
    return await this.fetchBalance(this.funds_name);
  }

  public get AssetName() {
    return this.assets_name;
  }

  public async AssetBalance() {
    return await this.fetchBalance(this.assets_name);
  }

  public async Valuation() {
    const [assetBalance, fundBalance, ticker] = await Promise.all([
      this.AssetBalance(),
      this.FundBalance(),
      this.config.client.fetchTicker(this.config.symbol),
    ]);
    return assetBalance * (ticker.close as number) + fundBalance;
  }
}

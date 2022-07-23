import cctx, { binance } from 'ccxt';
import { ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { append_list } from '../../utils/json_list';
import { retryer } from '../../utils/retryer';

export
class BinanceSpot
implements ISpotExecutor {
  public constructor(
    private readonly symbol: string,
    private readonly client: binance,
    private readonly retries = 5,
    private readonly transactions_file: string,
  ) {
    this.asset_name = this.symbol.split('/')[0].trim();
    this.fund_name = this.symbol.split('/')[1].trim();
  }

  private asset_name!: string;
  private fund_name!: string;

  public Transactions() {
    return [] as ITransaction[];
  }

  public async buy(
    in_assets: number,
    price?: number,
  ) {
    const request_time = Number(new Date());
    const order = await this.client.createMarketOrder(
      this.symbol,
      'buy',
      0,
      undefined,
      {
        quoteOrderQty: this.client.costToPrecision(this.symbol, in_assets),
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
      in_name: this.fund_name,
      expected_in_amount: in_assets,
      in_amount: order.cost,
      out_name: this.asset_name,
      out_amount: order.amount - (order.fee.currency === this.asset_name ? order.fee.cost : 0),
    };
    append_list(this.transactions_file, tn);
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
      this.retries,
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
      this.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public async sell(
    in_assets: number,
    price?: number,
  ) {
    const request_time = Number(new Date());
    const order = await this.client.createMarketOrder(
      this.symbol,
      'sell',
      this.client.amountToPrecision(this.symbol, in_assets),
    );
    const response_time = Number(new Date());
    const tn: ITransaction = {
      action: 'SELL',
      request_time,
      transaction_time: order.timestamp,
      response_time,
      expected_price: price as number,
      price: order.price,
      in_name: this.asset_name,
      expected_in_amount: in_assets,
      in_amount: order.amount,
      out_name: this.fund_name,
      out_amount: order.cost - (order.fee.currency === this.fund_name ? order.fee.cost : 0),
    };
    append_list(this.transactions_file, tn);
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
      this.retries,
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
      this.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public Reset() {

  }

  private async fetchBalance(name: string) {
    const balance = await this.client.fetchBalance();
    return balance[name].free;
  }

  public get FundName() {
    return this.fund_name;
  }

  public async FundBalance() {
    return await this.fetchBalance(this.fund_name);
  }

  public get AssetName() {
    return this.asset_name;
  }

  public async AssetBalance() {
    return await this.fetchBalance(this.asset_name);
  }

  public async Valuation() {
    const [assetBalance, fundBalance, ticker] = await Promise.all([
      this.AssetBalance(),
      this.FundBalance(),
      this.client.fetchTicker(this.symbol),
    ]);
    return assetBalance * (ticker.close as number) + fundBalance;
  }
}

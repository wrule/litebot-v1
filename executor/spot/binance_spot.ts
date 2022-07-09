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
    this.target_name = this.symbol.split('/')[0].trim();
    this.source_name = this.symbol.split('/')[1].trim();
  }

  private target_name!: string;
  private source_name!: string;

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
      side: 'buy',
      request_time,
      transaction_time: order.timestamp,
      response_time,
      expected_price: price as number,
      price: order.price,
      in_name: this.source_name,
      expected_in_amount: in_assets,
      in_amount: order.cost,
      out_name: this.target_name,
      out_amount: order.amount - (order.fee.currency === this.target_name ? order.fee.cost : 0),
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
    const balance = await this.client.fetchBalance();
    const free: number = balance[this.source_name].free;
    return await this.buy(free, price);
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
      side: 'sell',
      request_time,
      transaction_time: order.timestamp,
      response_time,
      expected_price: price as number,
      price: order.price,
      in_name: this.target_name,
      expected_in_amount: in_assets,
      in_amount: order.amount,
      out_name: this.source_name,
      out_amount: order.cost - (order.fee.currency === this.source_name ? order.fee.cost : 0),
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
    const balance = await this.client.fetchBalance();
    const free: number = balance[this.target_name].free;
    return await this.sell(free, price);
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
}

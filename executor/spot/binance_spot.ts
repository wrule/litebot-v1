import cctx, { binance } from 'ccxt';
import { ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { retryer } from '../../utils/retryer';

export
class BinanceSpot
implements ISpotExecutor {
  public constructor(
    private readonly symbol: string,
    private readonly client: binance,
    private readonly retries = 5,
  ) {
    this.target_name = this.symbol.split('/')[0].trim();
    this.source_name = this.symbol.split('/')[1].trim();
    this.transactions = [];
  }

  private target_name!: string;
  private source_name!: string;
  private transactions!: ITransaction[];

  private async buy(
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
    this.transactions.push(tn);
    return tn;
  }

  public async Buy(
    in_assets: number,
    price?: number,
  ) {
    return await retryer(
      this.buy,
      [in_assets, price],
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
      this.buy_all,
      [price],
      this.retries,
      (error) => error instanceof cctx.NetworkError,
    );
  }

  public async Sell(
    in_assets: number,
    price?: number,
  ) {
    try {
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
    this.transactions.push(tn);
    console.log(tn);
    return tn;
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  public async SellAll(price?: number) {
    const balance = await this.client.fetchBalance();
    const free: number = balance[this.target_name].free;
    if (free > 0) {
      return await this.Sell(free, price);
    }
    return null;
  }
}

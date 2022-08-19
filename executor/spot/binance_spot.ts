import { SymbolSplit } from '../../common/symbol';
import { binance } from 'ccxt';
import { ISpotExecutor } from '.';
import { ITransaction } from '../../common/transaction';
import { Logger } from '../../utils/logger';
import { IList } from '../../utils/list';
import { ISnapshot } from '../../common/snapshot';

/**
 * 币安现货执行者配置参数
 */
export
interface BinanceSpotConfig {
  /**
   * 币安客户端
   */
  client: binance;
  /**
   * 交易对
   */
  symbol: string;
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
  /**
   * 日志记录器
   */
  logger?: Logger;
}

/**
 * 币安现货执行者
 */
export
class BinanceSpot
implements ISpotExecutor {
  public constructor(private readonly config: BinanceSpotConfig) {
    this.available_funds_amount = this.config.init_funds_amount;
    this.available_assets_amount = this.config.init_assets_amount || 0;
    [this.assets_name, this.funds_name] = SymbolSplit(this.config.symbol);
  }

  /**
   * 资金名称
   */
  private funds_name = '';
  /**
   * 账户资金数量
   */
  private account_funds_amount = 0;
  /**
   * 可用资金数量
   */
  private available_funds_amount = 0;

  /**
   * 资产名称
   */
  private assets_name = '';
  /**
   * 账户资产数量
   */
  private account_assets_amount = 0;
  /**
   * 可用资产数量
   */
  private available_assets_amount = 0;

  /**
   * 同步账户信息
   */
  public async SyncAccount() {
    const balance = await this.config.client.fetchBalance();
    this.account_funds_amount = balance[this.funds_name].free;
    this.account_assets_amount = balance[this.assets_name].free;
    if (this.available_funds_amount > this.account_funds_amount) {
      this.config.logger?.log(
        '预期资金数量', this.available_funds_amount,
        '大于',
        '账户资金数量', this.account_funds_amount,
        '将重置为账户资金数量',
      );
      this.available_funds_amount = this.account_funds_amount;
    }
    if (this.available_assets_amount > this.account_assets_amount) {
      this.config.logger?.log(
        '预期资产数量', this.available_assets_amount,
        '大于',
        '账户资产数量', this.account_assets_amount,
        '将重置为账户资产数量',
      );
      this.available_assets_amount = this.account_assets_amount;
    }
    this.config.logger?.log(
      '同步账户完成',
      '预期资金数量', this.available_funds_amount,
      '账户资金数量', this.account_funds_amount,
      '预期资产数量', this.available_assets_amount,
      '账户资产数量', this.account_assets_amount,
    );
  }

  public async Transactions() {
    return (await this.config?.transaction_list?.All()) || [];
  }

  public async Snapshots() {
    return (await this.config?.snapshot_list?.All()) || [];
  }

  private async buy(
    in_amount: number,
    price?: number,
  ) {
    this.config.logger?.log('准备使用', in_amount, '个', this.FundName, '购买获得', this.AssetName);
    const request_time = Number(new Date());
    const order = await this.config.client.createMarketOrder(
      this.config.symbol,
      'buy',
      0,
      undefined,
      {
        quoteOrderQty: this.config.client.costToPrecision(this.config.symbol, in_amount),
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
      expected_in_amount: in_amount,
      in_amount: order.cost,
      out_name: this.assets_name,
      // TODO 查明原因，错误兼容
      out_amount: order.amount - (order.fee?.currency === this.assets_name ? order.fee.cost : 0),
    };
    await this.config.transaction_list?.Append(tn);
    this.available_funds_amount -= tn.in_amount;
    this.available_assets_amount += tn.out_amount;
    this.config.logger?.log('购买结果\n', tn);
    return tn;
  }

  public async Buy(
    in_amount: number,
    price?: number,
  ) {
    await this.SyncAccount();
    if (in_amount > this.available_funds_amount) {
      this.config.logger?.log(
        '输入资金数量', in_amount,
        '大于',
        '可用资金数量', this.available_funds_amount,
        '将重置为可用资金数量',
      );
      in_amount = this.available_funds_amount;
    }
    return this.buy(in_amount, price);
  }

  public async BuyAll(price?: number) {
    await this.SyncAccount();
    return await this.buy(this.available_funds_amount, price);
  }

  public async sell(
    in_amount: number,
    price?: number,
  ) {
    this.config.logger?.log('准备使用', in_amount, '个', this.AssetName, '出售收回', this.FundName);
    const request_time = Number(new Date());
    const order = await this.config.client.createMarketOrder(
      this.config.symbol,
      'sell',
      this.config.client.amountToPrecision(this.config.symbol, in_amount),
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
      expected_in_amount: in_amount,
      in_amount: order.amount,
      out_name: this.funds_name,
      // TODO 查明原因，错误兼容
      out_amount: order.cost - (order.fee?.currency === this.funds_name ? order.fee.cost : 0),
    };
    await this.config.transaction_list?.Append(tn);
    this.available_assets_amount -= tn.in_amount;
    this.available_funds_amount += tn.out_amount;
    this.config.logger?.log('出售结果\n', tn);
    return tn;
  }

  public async Sell(
    in_amount: number,
    price?: number,
  ) {
    await this.SyncAccount();
    if (in_amount > this.available_assets_amount) {
      this.config.logger?.log(
        '输入资产数量', in_amount,
        '大于',
        '可用资产数量', this.available_assets_amount,
        '将重置为可用资产数量',
      );
      in_amount = this.available_assets_amount;
    }
    return this.sell(in_amount, price);
  }

  public async SellAll(price?: number) {
    await this.SyncAccount();
    return await this.sell(this.available_assets_amount, price);
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

  public async UpdateSnapshot() {
    if (this.config?.snapshot_list) {
      this.config.snapshot_list.Append(
        await this.LatestSnapshot(),
      );
    }
  }

  public async LatestSnapshot(): Promise<ISnapshot> {
    return {
      valuation: await this.Valuation(),
    };
  }
}

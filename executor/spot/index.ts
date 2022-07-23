// 2022年07月19日21:26:55
import { ITransaction } from '@/common/transaction';

/**
 * 现货执行者接口
 */
export
interface ISpotExecutor {
  /**
   * 资金名称
   */
  FundName: string;

  /**
   * 可用资金余额
   */
  FundBalance(): number | Promise<number>;

  /**
   * 资产名称
   */
  AssetName: string;

  /**
   * 可用资产余额
   */
  AssetBalance(): number | Promise<number>;

  /**
   * 获取当前估值
   * @param price 当前资产价格（回测使用）
   */
  Valuation(price?: number): number | Promise<number>;

  /**
   * 获取交易数据列表
   */
  Transactions(): ITransaction[] | Promise<ITransaction[]>;

  /**
   * 购买资产
   * @param in_asset 期望输入资产
   * @param price 期望成交价
   * @param time 交易时间（回测使用）
   * @returns 交易数据
   */
  Buy(
    in_asset: number,
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  /**
   * 使用全部资金购买资产
   * @param price 期望成交价
   * @param time 交易时间（回测使用）
   * @returns 交易数据
   */
  BuyAll(
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  /**
   * 出售资产
   * @param in_asset 期望输入资产
   * @param price 期望成交价
   * @param time 交易时间（回测使用）
   * @returns 交易数据
   */
  Sell(
    in_asset: number,
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  /**
   * 出售全部资产
   * @param price 期望成交价
   * @param time 交易时间（回测使用）
   * @returns 交易数据
   */
  SellAll(
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  /**
   * 重置机器人（回测使用）
   */
  Reset(): void;
}

import { ReturnTransactionAS } from '../../common/transaction';

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

  Buy(
    in_asset: number,
    price?: number,
    time?: number,
  ): ReturnTransactionAS;

  BuyAll(
    price?: number,
    time?: number,
  ): ReturnTransactionAS;

  Sell(
    in_asset: number,
    price?: number,
    time?: number,
  ): ReturnTransactionAS;

  SellAll(
    price?: number,
    time?: number,
  ): ReturnTransactionAS;

  /**
   * 重置测试机器人
   */
  Reset(): void;
}

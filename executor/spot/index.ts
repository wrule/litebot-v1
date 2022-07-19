import { ITransaction } from '@/common/transaction';

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
  ): ITransaction | Promise<ITransaction>;

  BuyAll(
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  Sell(
    in_asset: number,
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  SellAll(
    price?: number,
    time?: number,
  ): ITransaction | Promise<ITransaction>;

  /**
   * 重置测试机器人
   */
  Reset(): void;
}

import { ReturnTransactionAS } from '../../common/transaction';

export
interface ISpotExecutor {
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

  Reset(): void;

  /**
   * 资金名称
   */
  FundName: string;

  /**
   * 资金数量
   */
  FundAmount(): number | Promise<number>;

  /**
   * 资产名称
   */
  AssetName: string;

  /**
   * 资产数量
   */
  AssetAmount(): number | Promise<number>;
}

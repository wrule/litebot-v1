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
}

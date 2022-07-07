
export
type Side = ('buy' | 'sell');

export
type Direction = ('LONG' | 'SHORT');

export
interface ITransaction {
  /**
   * 买卖方向
   */
  side?: Side;
  /**
   * 多空方向
   */
  direction?: Direction;
  /**
   * 请求时间
   */
  request_time: number;
  /**
   * 成交时间
   */
  transaction_time: number;
  /**
   * 响应时间
   */
  response_time: number;
  /**
   * 期望价格
   */
  expected_price: number;
  /**
   * 成交价格
   */
  price: number;
  /**
   * 输入资产名称
   */
  in_name: string;
  /**
   * 期望输入资产数量
   */
  expected_in_amount: number;
  /**
   * 成交输入资产数量
   */
  in_amount: number;
  /**
   * 输出资产名称
   */
  out_name: string;
  /**
   * 输出资产数量
   */
  out_amount: number;
}

export
type ReturnTransaction = (ITransaction | null);

export
type ReturnTransactionAS = (Promise<ReturnTransaction> | ReturnTransaction);

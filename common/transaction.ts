
/**
 * 交易行为
 */
export
type TransactionAction = ('BUY' | 'SELL');

/**
 * 交易方向
 */
export
type TransactionSide = ('LONG' | 'SHORT');

/**
 * 交易结构
 */
export
interface ITransaction {
  /**
   * 买卖方向
   */
  action?: TransactionAction;
  /**
   * 多空方向
   */
  side?: TransactionSide;
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

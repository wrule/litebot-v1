import moment from 'moment';
import { ArrayToKLine } from './common/kline';
import ETH_USDT_2h from './data/ETH_USDT-2h.json';
import { TestSpot } from './executor/spot/test_spot';
import { T07 } from './robot/spot/t07';

async function main() {
  const executor = new TestSpot({
    symbol: 'ETH/USDT',
    fee: 0.001,
    init_funds_amount: 100,
  });
  const robot = new T07({
    params: {
      macd_fast_ma: 9,
      macd_slow_ma: 44,
      macd_diff_ma: 9,
      cross_limit: 3,
      sold_candles: 5,
      atr: 7,
      atr_multiplier: 0.5,
    },
    executor: executor,
  });
  const kline = ArrayToKLine(ETH_USDT_2h);
  await robot.BackTesting(kline);
  console.log(executor.FundBalance, executor.AssetBalance);
}

main();

import { ArrayToKLine } from './common/kline';
import ETH_USDT_2h from './data/ETH_USDT-2h.json';
import { TestSpot } from './executor/spot/test_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross';

async function main() {
  const kline = ArrayToKLine(ETH_USDT_2h);
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({ params: { fast_ma: 9, slow_ma: 44, }, executor, });
  await robot.BackTesting(kline);
  console.log(executor.Valuation(1600));
  console.log(executor.Valuation(1600));
}

main();


import { ITransaction } from './common/transaction';
import { TestSpot } from './executor/spot/test_spot';
import { ArrayToKLine } from './common/kline';
import ETH_USDT_2h from './data/ETH_USDT-2h.json';
import BTC_USDT_2h from './data/BTC_USDT-2h.json';
import OP_USDT_2h from './data/OP_USDT-2h.json';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { JSONList } from './utils/list/json_list';
import { ISnapshot } from './common/snapshot';

async function main() {
  const kline = ArrayToKLine(ETH_USDT_2h);
  const spot = new TestSpot({ symbol: 'ETH/USDT', init_funds_amount: 100, fee: 0.001 });
  let max = -1, max_info = '';
  for (let i = 2; i < 100; ++i) {
    for (let j = i + 1; j < 100; ++j) {
      const robot = await new TwoMaCross({ params: { fast_ma: i, slow_ma: j }, executor: spot }).Reset();
      await robot.BackTesting(kline);
      if (spot.Valuation(1592) > max) {
        max = spot.Valuation(1592);
        max_info = `${i}:${j}`;
      }
      console.log(i, j, spot.Valuation(1592), max, max_info);
    }
  }
}

main();

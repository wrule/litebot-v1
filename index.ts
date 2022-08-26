
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
  console.log('你好，世界');
  const kline = ArrayToKLine(ETH_USDT_2h);
  const spot = new TestSpot({
    symbol: 'ETH/USDT',
    init_funds_amount: 100,
    fee: 0.001,
    transaction_list: new JSONList<ITransaction>('output/test_tn.json'),
    snapshot_list: new JSONList<ISnapshot>('output/test_sp.json'),
  });
  await spot.Reset();
  const robot = new TwoMaCross({ fast_ma: 9, slow_ma: 44 }, spot);
  await robot.BackTesting(kline);
  console.log(kline.length, spot.Valuation(1592));
}

main();

import { TwoMaCross } from './robot/spot/two_ma_cross';
import { TestSpot } from './executor/spot/test_spot';
import HistData from './data/ETH_USDT-2h.json';
import { ArrayToKLine } from './common/kline';

async function main() {
  const executor = new TestSpot(100, 0.001, false, 'USDT', 'ETH');
  const robot = new TwoMaCross({ fast_ma: 10, slow_ma: 21 }, executor);
  const testData = robot.GenerateTestData(ArrayToKLine(HistData));
  robot.BackTesting(testData);
  const v = await robot.Executor.Valuation(3026.85);
  console.log(v);
}

main();

import { TwoMaCross } from './robot/spot/two_ma_cross';
import { TestSpot } from './executor/spot/test_spot';
import HistData from './data/ETH_USDT-2h.json';
import { ArrayToKLine } from './common/kline';

async function main() {
  let testData: any[] = [];
  console.log('开始');
  const executor = new TestSpot(100, 0.001, false, 'USDT', 'ETH');
  for (let fast = 2; fast < 200; ++fast) {
    for (let slow = fast + 1; slow < 200; ++slow) {
      const robot = new TwoMaCross({ fast_ma: fast, slow_ma: slow }, executor);
      if (testData.length < 1) {
        testData = robot.GenerateTestData(ArrayToKLine(HistData));
      }
      robot.BackTesting(testData);
      const v = await robot.Executor.Valuation(3026.85);
      // console.log(fast, v);
    }
  }
  console.log('结束');
}

main();

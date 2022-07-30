import { TwoMaCross } from './robot/spot/two_ma_cross';
import { TestSpot } from './executor/spot/test_spot';
// import HistData from './data/ETH_USDT-2h.json';
import { ArrayToKLine, IOHLCV } from './common/kline';
import { IList } from './utils/list';
import { JSONList } from './utils/list/json_list';
import { MemoryList } from './utils/list/memory_list';
import { Report } from './report';
import path from 'path';
import fs from 'fs';

// async function main() {
//   const realData = ArrayToKLine(HistData);
//   let maxValuation = -1;
//   console.log('开始');
//   const executor = new TestSpot(100, 0.001, false, 'USDT', 'ETH');
//   for (let fast = 2; fast < 200; ++fast) {
//     for (let slow = fast + 1; slow < 200; ++slow) {
//       const robot = new TwoMaCross({ fast_ma: fast, slow_ma: slow }, executor);
//       robot.BackTesting(realData);
//       const valuation = await robot.Executor.Valuation(3026.85);
//       if (valuation > maxValuation) {
//         maxValuation = valuation;
//         console.log(fast, slow, valuation);
//       }
//     }
//   }
//   console.log('结束');
// }

// main();

async function testMain() {
  // const report = new Report<any, IOHLCV, IOHLCV>({
  //   meta_data: new JSONList<any>('meta.json'),
  // });
  // const a = await report.Meta();
  // console.log(a);
  // await report.UpdateMeta({
  //   name: '鸡毛的报告',
  // });
}

testMain();

import { JSONFileReport } from '../report/json_file_report';
import { MemoryReport } from '../report/memory_report';
import { ArrayToKLine } from '../common/kline';
import ETH_USDT_2h from '../data/ETH_USDT-2h.json';
import { TestSpot } from '../executor/spot/test_spot';
import { IParams, TwoMaCross } from '../robot/spot/two_ma_cross';

const kline = ArrayToKLine(ETH_USDT_2h);

async function back_testing(params: IParams) {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({
    name: '回测',
    params: { fast_size: params.fast_size, slow_size: params.slow_size, },
    executor,
    report: new JSONFileReport('output/kkk'),
    // report: new MemoryReport(),
  });
  await robot.BackTesting(kline);
  return executor.Valuation(1600);
}

async function main() {
  console.log(await back_testing({ fast_size: 9, slow_size: 44, }));
}

main();

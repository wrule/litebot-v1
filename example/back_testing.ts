import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { TwoMaCross } from '../robot/spot/two_ma_cross';
import ETH_USDT_2h from '../data/ETH_USDT-2h.json';

const kline = ArrayToKLine(ETH_USDT_2h);

async function back_testing(params: any) {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({ params: { fast_ma: params.fast_ma, slow_ma: params.slow_ma, }, executor, });
  await robot.BackTesting(kline);
  return executor.Valuation(1600);
}

async function main() {
  console.log(await back_testing({ fast_ma: 9, slow_ma: 44, }));
}

main();

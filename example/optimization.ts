import { MemoryReport } from '../report/memory_report';
import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, TwoMaCross } from '../robot/spot/two_ma_cross';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/BTC_USDT-1h.json');
const kline = ArrayToKLine(ohlcv_data);

let count = 0;

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'BTC/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new TwoMaCross({ params, executor });
  await robot.BackTesting(kline);
  console.log(count++);
  return { output: executor.Valuation(21656.87) };
}

async function main() {
  // console.log(await back_testing({ fast_size: 9, slow_size: 44, }));
  // return;
  const opt = new Optimizer({
    space: [
      { name: 'fast_size', range: [2, 100], },
      { name: 'slow_size', range: [2, 100], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    input_filter: (input) => Math.abs(input.slow_size - input.fast_size) > 9,
    input_mapper: (input) => ({
      fast_size: input.fast_size < input.slow_size ? input.fast_size : input.slow_size,
      slow_size: input.fast_size < input.slow_size ? input.slow_size : input.fast_size,
    }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

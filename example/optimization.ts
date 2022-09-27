import { MemoryReport } from '../report/memory_report';
import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, TwoMaCross } from '../robot/spot/two_ma_cross_stop';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/ETH_USDT-2h.json');
const kline = ArrayToKLine(ohlcv_data);

let count = 0;

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new TwoMaCross({ params, executor });
  await robot.BackTesting(kline);
  console.log(count++);
  return { output: executor.Valuation(1690.48) };
}

async function main() {
  console.log(await back_testing({ fast_size: 10, slow_size: 41, stop_rate: 0.0311 }));
  return;
  // const opt = new Optimizer({
  //   space: [
  //     { name: 'fast_size', range: [2, 20], },
  //     { name: 'slow_size', range: [60, 80], },
  //   ],
  //   objective_function: back_testing,
  //   loss_function: (output) => 1 / output.output,
  //   input_filter: (input) => Math.abs(input.slow_size - input.fast_size) > 29,
  //   input_mapper: (input) => ({
  //     fast_size: input.fast_size < input.slow_size ? input.fast_size : input.slow_size,
  //     slow_size: input.fast_size < input.slow_size ? input.slow_size : input.fast_size,
  //   }),
  //   logger: new Logger(),
  // });
  // opt.Search();
}

main();

import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, TwoMaCross } from '../robot/spot/two_ma_cross';
import { Logger } from '../utils/logger';

const LINK_USDT_30m = require('../../data/LINK_USDT-30m.json');
const kline = ArrayToKLine(LINK_USDT_30m);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'LINK/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({ name: '', params: { fast_size: params.fast_size, slow_size: params.slow_size, }, executor, });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(7.9), };
}

async function main() {
  const a = await back_testing({ fast_size: 9, slow_size: 44 });
  console.log(a);
  // const opt = new Optimizer({
  //   space: [
  //     { name: 'fast_ma', range: [2, 100], },
  //     { name: 'slow_ma', range: [2, 100], },
  //   ],
  //   objective_function: back_testing,
  //   loss_function: (output) => 1 / output.output,
  //   input_mapper: (input) => ({
  //     fast_ma: input.fast_ma < input.slow_ma ? input.fast_ma : input.slow_ma,
  //     slow_ma: input.fast_ma < input.slow_ma ? input.slow_ma : input.fast_ma,
  //   }),
  //   logger: new Logger(),
  // });
  // opt.Search();
}

main();

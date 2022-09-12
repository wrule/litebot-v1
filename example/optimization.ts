import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, TwoMaCross } from '../robot/spot/two_ma_cross';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/LINK_USDT-15m.json');
const kline = ArrayToKLine(ohlcv_data);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'LINK/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({ name: '', params: { fast_size: params.fast_size, slow_size: params.slow_size, }, executor, });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(7.9), };
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'fast_size', range: [2, 100], },
      { name: 'slow_size', range: [2, 100], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    input_mapper: (input) => ({
      fast_size: input.fast_size < input.slow_size ? input.fast_size : input.slow_size,
      slow_size: input.fast_size < input.slow_size ? input.slow_size : input.fast_size,
    }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

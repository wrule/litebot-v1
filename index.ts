import { ArrayToKLine } from './common/kline';
import ETH_USDT_2h from './data/ETH_USDT-2h.json';
import { TestSpot } from './executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from './optimizer';
import { IParams, TwoMaCross } from './robot/spot/two_ma_cross';
import { Logger } from './utils/logger';

const kline = ArrayToKLine(ETH_USDT_2h);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100, });
  const robot = new TwoMaCross({ params: { fast_ma: params.fast_ma, slow_ma: params.slow_ma, }, executor, });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(1600), };
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'fast_ma', range: [2, 100], },
      { name: 'slow_ma', range: [2, 100], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    input_mapper: (input) => ({
      fast_ma: input.fast_ma < input.slow_ma ? input.fast_ma : input.slow_ma,
      slow_ma: input.fast_ma < input.slow_ma ? input.slow_ma : input.fast_ma,
    }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

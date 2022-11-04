import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, SRSI_Martin } from '../robot/spot/srsi_martin';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/SOL_USDT-2h.json');
const kline = ArrayToKLine(ohlcv_data);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new SRSI_Martin({ params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(kline[kline.length - 1].close) };
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'rsi_size', range: [64, 64], },
      { name: 'k_size', range: [98, 98], },
      { name: 'd_size', range: [74, 74], },
      { name: 'stoch_size', range: [40, 40], },
      // { name: 'fast_size', range: [2, 100], },
      // { name: 'slow_size', range: [2, 100], },
      // { name: 'atr_period', range: [2, 30], },
      // { name: 'atr_multiplier', range: [2, 5], },
      // { name: 'fast', range: [2, 100], },
      // { name: 'slow', range: [2, 100], },
      // { name: 'smooth', range: [2, 100], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    // input_filter: (input) => Math.abs(input.slow - input.fast) > 5,
    // input_mapper: (input) => ({
    //   fast: input.fast < input.slow ? input.fast : input.slow,
    //   slow: input.fast < input.slow ? input.slow : input.fast,
    //   smooth: input.smooth,
    // }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

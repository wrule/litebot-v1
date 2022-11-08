import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, KD_SMA_DIFF } from '../robot/spot/kd_sma_diff';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/BTC_USDT-1h.json');
const kline = ArrayToKLine(ohlcv_data);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new KD_SMA_DIFF({ params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(kline[kline.length - 1].close) };
}

async function main() {
  const opt = new Optimizer({
    space: [
      // { name: 'kama_period', range: [2, 100], },
      // { name: 'rsi_size', range: [2, 30], },
      { name: 'k_size', range: [2, 6], },
      { name: 'd_size', range: [5, 9], },
      // { name: 'stoch_size', range: [21, 21], },
      { name: 'fast_size', range: [13, 17], },
      { name: 'slow_size', range: [27, 31], },
      // { name: 'atr_period', range: [2, 30], },
      // { name: 'atr_multiplier', range: [2, 5], },
      // { name: 'fast', range: [2, 100], },
      // { name: 'slow', range: [2, 100], },
      // { name: 'smooth', range: [2, 100], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    // input_filter: (input) => Math.abs(input.slow_size - input.fast_size) > 5,
    input_mapper: (input) => ({
      ...input,
      fast_size: input.fast_size < input.slow_size ? input.fast_size : input.slow_size,
      slow_size: input.fast_size < input.slow_size ? input.slow_size : input.fast_size,
    }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

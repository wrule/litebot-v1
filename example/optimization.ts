import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, MACD } from '../robot/spot/macd';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/ETH_USDT-1d.json');
const kline = ArrayToKLine(ohlcv_data);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new MACD({ params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(kline[kline.length - 1].close) };
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'fast', range: [2, 50], },
      { name: 'slow', range: [2, 50], },
      { name: 'smooth', range: [2, 50], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    // input_filter: (input) => Math.abs(input.slow_size - input.fast_size) > 29,
    input_mapper: (input) => ({
      fast: input.fast < input.slow ? input.fast : input.slow,
      slow: input.fast < input.slow ? input.slow : input.fast,
      smooth: input.smooth,
    }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

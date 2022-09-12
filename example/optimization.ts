import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, SRSI_Martin } from '../robot/spot/srsi_martin';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/LINK_USDT-1h.json');
const kline = ArrayToKLine(ohlcv_data);

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'LINK/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new SRSI_Martin({ name: '', params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(7.9), };
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'rsi_size', range: [18, 20], },
      { name: 'k_size', range: [17, 19], },
      { name: 'd_size', range: [14, 16], },
      { name: 'stoch_size', range: [53, 59], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    // input_mapper: (input) => ({
    //   fast_size: input.fast_size < input.slow_size ? input.fast_size : input.slow_size,
    //   slow_size: input.fast_size < input.slow_size ? input.slow_size : input.fast_size,
    // }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

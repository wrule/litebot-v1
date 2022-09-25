import { MemoryReport } from '../report/memory_report';
import { ArrayToKLine } from '../common/kline';
import { TestSpot } from '../executor/spot/test_spot';
import { IFunctionOutput, Optimizer } from '../optimizer';
import { IParams, SRSI_Martin } from '../robot/spot/srsi_martin';
import { Logger } from '../utils/logger';

const ohlcv_data = require('../../data/BTC_USDT-1h.json');
const kline = ArrayToKLine(ohlcv_data);

let count = 0;

async function back_testing(params: IParams): Promise<IFunctionOutput<any>> {
  const executor = new TestSpot({ symbol: 'BTC/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new SRSI_Martin({ params, executor });
  await robot.BackTesting(kline);
  console.log(count++);
  return { output: executor.Valuation(21656.87) };
}

async function main() {
  // console.log(await back_testing({ rsi_size: 19, k_size: 18, d_size: 15, stoch_size: 56, stop_rate: 0.03, }));
  // return;
  const opt = new Optimizer({
    space: [
      { name: 'rsi_size', range: [2, 100], },
      { name: 'k_size', range: [2, 100], },
      { name: 'd_size', range: [2, 100], },
      { name: 'stoch_size', range: [2, 120], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    input_mapper: (input) => ({ ...input, stop_rate: 1 }),
    logger: new Logger(),
  });
  opt.Search();
}

main();

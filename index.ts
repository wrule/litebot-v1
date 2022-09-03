import { IParams, SRSI_Martin } from './robot/spot/srsi_martin';
import ETH_USDT_1h from './data/ETH_USDT-1h.json';
import { ArrayToKLine } from './common/kline';
import { TestSpot } from './executor/spot/test_spot';
import { Optimizer } from './optimizer';
import { Logger } from './utils/logger';

const kline = ArrayToKLine(ETH_USDT_1h);

async function back_testing(params: IParams) {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new SRSI_Martin({ params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(1600) }
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'rsi_size', range: [2, 30], },
      { name: 'k_size', range: [2, 30], },
      { name: 'd_size', range: [2, 40], },
      { name: 'stoch_size', range: [10, 50], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    logger: new Logger(),
  });
  opt.Search();
}

main();

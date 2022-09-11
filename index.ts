import { IParams, SRSI_Martin } from './robot/spot/srsi_martin';
const ETH_USDT_1h = require('./data/ETH_USDT-30m.json');
import { ArrayToKLine } from './common/kline';
import { TestSpot } from './executor/spot/test_spot';
import { Optimizer } from './optimizer';
import { Logger } from './utils/logger';

const kline = ArrayToKLine(ETH_USDT_1h as any[]);

console.log('30m', kline.length);

async function back_testing(params: IParams) {
  const executor = new TestSpot({ symbol: 'ETH/USDT', fee: 0.001, init_funds_amount: 100 });
  const robot = new SRSI_Martin({ name: 'test', params, executor });
  await robot.BackTesting(kline);
  return { output: executor.Valuation(1600) }
}

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'rsi_size', range: [13, 13], },
      { name: 'k_size', range: [30, 34], },
      { name: 'd_size', range: [43, 47], },
      { name: 'stoch_size', range: [43, 47], },
    ],
    objective_function: back_testing,
    loss_function: (output) => 1 / output.output,
    logger: new Logger(),
  });
  opt.Search();
}

main();

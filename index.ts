import moment from 'moment';
import { ArrayToKLine } from './common/kline';
import ETH_USDT_2h from './data/ETH_USDT-2h.json';
import { TestSpot } from './executor/spot/test_spot';
import { Optimizer } from './optimizer';
import { Vector } from './optimizer/vector';
import { T07 } from './robot/spot/t07/t07';

const kline = ArrayToKLine(ETH_USDT_2h);

async function func(params: any) {
  const executor = new TestSpot({
    symbol: 'ETH/USDT',
    fee: 0.001,
    init_funds_amount: 100,
  });
  const robot = new T07({
    params: {
      // macd_fast_ma: 9,
      // macd_slow_ma: 44,
      // macd_diff_ma: 9,
      // cross_limit: 3,
      // sold_candles: 5,
      ...params,
      atr: 7,
      atr_multiplier: 0.5,
    },
    executor: executor,
  });
  await robot.BackTesting(kline);
  return executor.Valuation(1600);
}

async function main() {
  // const vector = new Vector([
  //   { name: 'macd_fast_ma', range: [2, 100], },
  //   { name: 'macd_slow_ma', range: [2, 100], },
  //   { name: 'macd_diff_ma', range: [2, 100], },
  //   { name: 'cross_limit', range: [2, 5], },
  //   { name: 'sold_candles', range: [2, 50], },
  // ]);
  // const input = vector.RandomKeyValue;
  // console.log(input);
  // const output = await func(input);
  // console.log(output);
  // return;
  const opt = new Optimizer({
    space: [
      { name: 'macd_fast_ma', range: [10, 30], },
      { name: 'macd_slow_ma', range: [40, 60], },
      { name: 'macd_diff_ma', range: [80, 100], },
      { name: 'cross_limit', range: [2, 3], },
      { name: 'sold_candles', range: [10, 20], },
    ],
    objective_function: func,
    loss_function: (output) => 1 / output,
    input_filter: (input) => input.macd_fast_ma < input.macd_slow_ma,
  });
  opt.Search();
}

main();

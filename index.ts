import moment from 'moment';
import { ArrayToKLine } from './common/kline';
import ETH_USDT_1d from './data/ETH_USDT-1d.json';
import { T07 } from './robot/spot/t07';

const robot = new T07({
  params: {
    macd_fast_ma: 9,
    macd_slow_ma: 44,
    macd_diff_ma: 9,
    cross_limit: 2,
    sold_candles: 9,
    atr: 7,
    atr_multiplier: 0.5,
  },
  executor: null as any,
});

const kline = ArrayToKLine(ETH_USDT_1d);
const result = robot.GenerateTestData(kline);
const v_result = result.filter((item) => item.buy || item.sell);
// console.log(v_result.slice(v_result.length - 10));
console.log(v_result.length);

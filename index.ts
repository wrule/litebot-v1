import { ArrayToKLine } from './common/kline';
import ETH_USDT_1d from './data/ETH_USDT-1d.json';
import { T07 } from './robot/spot/t07';

const robot = new T07({
  params: {
    macd_fast_ma: 9,
    macd_slow_ma: 44,
    macd_diff_ma: 9,
    cross_limit: 3,
    sold_candles: 16,
    atr: 7,
    atr_multiplier: 0.5,
  },
  executor: null as any,
});

const kline = ArrayToKLine(ETH_USDT_1d);
const result = robot.GenerateTestData(kline);
console.log(kline.length);
console.log(result.dif.length);
console.log(result.dea.length);
console.log(result.macd.length);

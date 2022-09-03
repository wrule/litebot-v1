import { SRSI_Martin } from './robot/spot/srsi_martin';
import ETH_USDT_1h from './data/ETH_USDT-1h.json';
import { ArrayToKLine } from './common/kline';

const kline = ArrayToKLine(ETH_USDT_1h);

async function main() {
  const robot = new SRSI_Martin({
    params: {
      fast_size: 12,
      slow_size: 26,
      smoothing_size: 9,
    },
    executor: null as any,
  });
  robot.GenerateTestData(kline);
}

main();

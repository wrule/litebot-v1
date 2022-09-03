import { SRSI_Martin } from './robot/spot/srsi_martin';
import ETH_USDT_1h from './data/ETH_USDT-1h.json';
import { ArrayToKLine } from './common/kline';

const kline = ArrayToKLine(ETH_USDT_1h);

async function main() {
  const robot = new SRSI_Martin({
    params: {
      rsi_size: 27,
      k_size: 4,
      d_size: 21,
      stoch_size: 33,
    },
    executor: null as any,
  });
  robot.GenerateTestData(kline);
}

main();

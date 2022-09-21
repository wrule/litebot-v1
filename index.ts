import { binance } from 'ccxt';
import { TestSpot } from './executor/spot/test_spot';
import { TwoMaCrossStop } from './robot/spot/two_ma_cross_stop';
import { KLineWatcher } from './watcher/kline_watcher';
import HistData from './data/ETH_USDT-2h.json';
import { ArrayToKLine } from './common/kline';

const secret = require('../.secret.json');

async function main() {
  console.log('你好，世界');
  // const client = new binance({
  //   apiKey: secret.API_KEY,
  //   secret: secret.SECRET_KEY,
  //   enableRateLimit: true,
  // });
  // console.log('加载市场');
  // await client.loadMarkets();
  // console.log('加载完成');
  const executor = new TestSpot({
    symbol: 'ETH/USDT',
    fee: 0.001,
    init_funds_amount: 100,
  });
  const robot = new TwoMaCrossStop({
    params: {
      fast_size: 9,
      slow_size: 44,
      stop_rate: 0.035,
    },
    executor,
  });
  const kline = ArrayToKLine(HistData);
  await robot.BackTesting(kline);
  const valuation = await executor.Valuation(1690.48);
  console.log(valuation);
  // const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '1m', robot.WatchLength);
  // watcher.Subscribe((kline) => {
  //   robot.CheckKLine(kline);
  // });
  // watcher.Start();
}

main();

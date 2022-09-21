import { binance } from 'ccxt';
import { TestSpot } from './executor/spot/test_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { KLineWatcher } from './watcher/kline_watcher';

const secret = require('../.secret.json');

async function main() {
  console.log('你好，世界');
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  console.log('加载市场');
  await client.loadMarkets();
  console.log('加载完成');
  const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '1m', 100);
  const executor = new TestSpot({
    symbol: 'ETH/USDT',
    fee: 0.001,
    init_funds_amount: 100,
  });
  const robot = new TwoMaCross({
    name: '测试',
    params: {
      fast_size: 9,
      slow_size: 44,
    },
    executor,
  });
  watcher.Subscribe((kline) => {
    robot.CheckKLine(kline);
  });
  watcher.Start();
}

main();

import { binance } from 'ccxt';
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
  const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '30m', 100);
  watcher.Subscribe((kline) => {
    console.log(kline.length);
  });
  watcher.Start();
}

main();

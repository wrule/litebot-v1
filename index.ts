import { binance } from 'ccxt';
import { JSONReport } from './report/json_report';
import { KLineWatcher } from './watcher/kline_watcher';
import secret from './.secret.json';

function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  const watcher = new KLineWatcher(client, 1000, 'BTC/USDT', '1m', 10)
  watcher.Subscribe((kline) => {
    console.log(kline.length);
  });
  watcher.Start();
}

main();

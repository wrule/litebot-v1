import { binance } from 'ccxt';
import { JSONReport } from './report/json_report';
import { KLineWatcher } from './watcher/kline_watcher';
import secret from './.secret.json';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { BinanceSpot } from './executor/spot/binance_spot';

function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  const watcher = new KLineWatcher(client, 1000, 'BTC/USDT', '1m', 100);
  const report = new JSONReport('output/test_ma');
  const executor = new BinanceSpot('BTC/USDT', client, 3, 'a.log');
  const robot = new TwoMaCross({ fast_ma: 9, slow_ma: 44 }, executor);
  console.log('开始');
  watcher.Subscribe((kline) => {
    console.log(kline.length);
  });
  watcher.Start();
}

main();

import { binance } from 'ccxt';
import { JSONReport } from './report/json_report';
import { KLineWatcher } from './watcher/kline_watcher';
import secret from './.secret.json';
import { IParams, TwoMaCross } from './robot/spot/two_ma_cross';
import { BinanceSpot } from './executor/spot/binance_spot';
import { IOHLCV } from './common/kline';

function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  const watcher = new KLineWatcher(client, 1000, 'BTC/USDT', '1m', 100);
  const report = new JSONReport<IParams, IOHLCV, IOHLCV>('output/test_ma');
  const executor = new BinanceSpot('BTC/USDT', client, 3, 'a.log');
  const robot = new TwoMaCross({ fast_ma: 9, slow_ma: 44 }, executor, report);
  console.log('开始');
  watcher.Subscribe(([kline, last]) => {
    robot.CheckKLine(kline, last);
  });
  watcher.Start();
}

main();

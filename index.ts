import { binance } from 'ccxt';
import { JSONReport } from './report/json_report';
import { KLineWatcher } from './watcher/kline_watcher';
import secret from './.secret.json';
import { IParams, TwoMaCross } from './robot/spot/two_ma_cross';
import { BinanceSpot } from './executor/spot/binance_spot';
import { IOHLCV } from './common/kline';
import { DingTalk } from './notifier/ding_talk';
import dingConfig from './.dingtalk.json';

function main() {
  const ding = new DingTalk({
    secret: dingConfig.SECRET,
    access_token: dingConfig.ACCESS_TOKEN,
    at_mobiles: dingConfig.AT_MOBILES,
  });
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '2h', 50);
  const report = new JSONReport<IParams, IOHLCV, IOHLCV>('output/test_ma');
  const executor = new BinanceSpot('ETH/USDT', client, 3, 'tn.log');
  const robot = new TwoMaCross({ fast_ma: 9, slow_ma: 44 }, executor, report, ding);
  console.log('开始');
  watcher.Subscribe((kline_snapshot) => {
    robot.CheckKLine(kline_snapshot.confirmed_kline, kline_snapshot.last);
  });
  watcher.Start();
}

main();

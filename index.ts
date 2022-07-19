import { binance } from 'ccxt';
import secret from './.secret.json';
import dingtalk from './.dingtalk.json';
import { DingTalk } from './notifier/ding_talk';
import { BinanceSpot } from './executor/spot/binance_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { ArrayToKLine, KLine } from './common/kline';
import { TestSpot } from './executor/spot/test_spot';
import HistData from './data/ETH_USDT-1d.json';
import { KLineWatcher } from './watcher/kline_watcher';
import { TickersWatcher } from './watcher/tickers_watcher';
import { append_list } from './utils/json_list';
import moment from 'moment';

async function main() {
  console.log('加载客户端...');
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  await client.loadMarkets();
  console.log('客户端加载完成');
  const executor = new BinanceSpot('ETH/USDT', client, 3, 'tn_log.json');
  const notifier = new DingTalk({
    access_token: dingtalk.ACCESS_TOKEN,
    secret: dingtalk.SECRET,
    at_mobiles: dingtalk.AT_MOBILES,
  });
  const robot = new TwoMaCross({ fast_ma: 11, slow_ma: 21 }, executor, notifier);
  // const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '30m', robot.KLineReadyLength);
  // watcher.Subscribe((kline) => {
  //   robot.CheckKLine(kline);
  // });
  const watcher = new TickersWatcher(
    client,
    1000,
    [
      'BTC/USDT',
      'ETH/USDT',
      'BNB/USDT',
      'ADA/USDT',
      'LINK/USDT',
      'APE/USDT',
      'DOT/USDT',
      'SOL/USDT',
      'DOGE/USDT',
      'UNI/USDT',
      'FTT/USDT',
      'ZEC/USDT',
      'CRV/USDT',
      'ENJ/USDT',
      'DENT/USDT',
      'NEAR/USDT',
      'SAND/USDT',
      'FIL/USDT',
      'AXS/USDT',
      'SHIB/USDT',
    ],
  );
  watcher.Subscribe((data) => {
    const result = Object.entries(data)
      .map(([key, value]) => ([key, value.timestamp, value.close]));
    append_list('history.log', result);
    if (result.length > 0) {
      console.log(moment(new Date(result[0][1] as number)).format('YYYY-MM-DD HH:mm:ss'));
    }
  });
  watcher.Start();
}

async function mainTest() {
  // const kline = ArrayToKLine(HistData as number[][], true);
  // const executor = new TestSpot(100, 0.001, false, 'USDT', 'BTC');

  // const start = Number(new Date());
  // const robot = new TwoMaCross({ fast_ma: 11, slow_ma: 21 }, executor);
  // robot.BackTesting(kline);
  // console.log(Number(new Date()) - start);
}

main();

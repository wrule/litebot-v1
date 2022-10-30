import { binance } from 'ccxt';
import { TestSpot } from './executor/spot/test_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross_stop';
import { KLineWatcher } from './watcher/kline_watcher';
import { ArrayToKLine } from './common/kline';
import { SRSI_Martin } from './robot/spot/srsi_martin';
import { SuperTrend } from './robot/spot/super_trend';

const HistData = require('../data/ETH_USDT-30m.json');
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
  const robot = new SuperTrend({
    params: {
      atr_period: 10,
      atr_multiplier: 3,
    },
    executor,
  });
  const kline = ArrayToKLine(HistData);
  await robot.BackTesting(kline);
  const valuation = await executor.Valuation(1591.85);
  console.log(valuation);
  // const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '1m', robot.WatchLength);
  // watcher.Subscribe((kline) => {
  //   robot.CheckKLine(kline);
  // });
  // watcher.Start();
}

main();

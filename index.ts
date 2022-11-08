import { binance } from 'ccxt';
import { TestSpot } from './executor/spot/test_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross_stop';
import { KLineWatcher } from './watcher/kline_watcher';
import { ArrayToKLine } from './common/kline';
import { SRSI_Martin } from './robot/spot/srsi_martin';
import { SuperTrend } from './robot/spot/super_trend';
import moment from 'moment';
import { JSONFileReport } from './report/json_file_report';
import fs from 'fs';
import { MACD } from './robot/spot/macd';
import { Kama } from './robot/spot/karma';
import { Nums, nums } from './utils/nums';
import { MemoryReport } from './report/memory_report';
import { KDRSI } from './robot/spot/kdrsi';
import { KD_SMA_DIFF } from './robot/spot/kd_sma_diff';

const HistData = require('../data/BTC_USDT-1h.json');
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
  const report = new MemoryReport();
  const robot = new KD_SMA_DIFF({ params: {
    fast_size: 15,
    slow_size: 29,
    k_size: 4,
    d_size: 7,
  }, executor, report: report as any });
  const kline = ArrayToKLine(HistData);
  // const a = robot.GenerateSignalData(kline);
  // console.log(a[a.length - 1]);
  // return;
  await robot.BackTesting(kline);
  const valuation = await executor.Valuation(kline[kline.length - 1].close);
  console.log(valuation);
  const games = await report.Games();
  const hc = games.filter((item) => item.length >= 2).map((item) =>
    (item[1].price - item[0].price) / item[0].price);
  console.log(hc.length);
  console.log(Math.max(...hc));
  console.log(Math.min(...hc));
  fs.writeFileSync('hc.json', JSON.stringify(hc.map((item) => `${Number((item * 100).toFixed(4))}%`), null, 2));
  console.log(hc);

  // const tns = await report.Transactions?.All();
  // if (tns) {
  //   let ntns = tns.slice(1, tns.length - 1);
  //   let n = 100;
  //   for (let i = 0; i < ntns.length; i += 2) {
  //     const buy_price = ntns[i].price;
  //     const sell_price = ntns[i + 1].price;
  //     const rate = 1 + (sell_price - buy_price) / buy_price;
  //     // console.log(buy_price, sell_price, rate);
  //     fs.appendFileSync('st.log', `${buy_price} ${sell_price} ${rate}\n`);
  //     n *= rate;
  //     n *= (0.999 * 0.999);
  //   }
  //   console.log(n);
  // }

  // const watcher = new KLineWatcher(client, 1000, 'ETH/USDT', '1m', robot.WatchLength);
  // watcher.Subscribe((kline) => {
  //   robot.CheckKLine(kline);
  // });
  // watcher.Start();
}

main();

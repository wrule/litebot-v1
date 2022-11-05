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

const HistData = require('../data/ETH_USDT-2h.json');
const secret = require('../.secret.json');

async function main() {
  console.log('你好，世界');
  const _kline = ArrayToKLine(HistData);
  const high = nums(_kline.map((item) => item.high));
  const low = nums(_kline.map((item) => item.low));
  const close = _kline.map((item) => item.close);
  const { K, D, J } = new Nums(close).SKDJ(low, high, 10, 9, 14, 18);
  console.log(fs.writeFileSync('1.log', JSON.stringify(J.Nums, null, 2)));
  console.log(moment(new Date(_kline[_kline.length - 1].time)).format('YYYY-MM-DD HH:mm:ss'));
  return;
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
  const robot = new Kama({ params: { fast_size: 9, slow_size: 44 }, executor });
  const kline = ArrayToKLine(HistData);
  // robot.GenerateSignalData(kline);
  await robot.BackTesting(kline);
  const valuation = await executor.Valuation(kline[kline.length - 1].close);
  console.log(valuation);

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

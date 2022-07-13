import { binance } from 'ccxt';
import secret from './.secret.json';
import { BinanceSpot } from './executor/spot/binance_spot';
import { retryer } from './utils/retryer';
import { write_list, read_list, append_list, delete_list } from './utils/json_list';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { ArrayToKLine } from './common/kline';
import axios from 'axios';
import HMACSHA256 from 'crypto-js/hmac-sha256';
import BASE64URL from 'crypto-js/enc-base64url';
import crypto from 'crypto';
import { DingTalk } from './notifier/ding_talk';

async function main() {
  console.log(1234);

  const notifier = new DingTalk({
    access_token: secret.DING2,
    secret: secret.DING,
    at_mobiles: secret.at_mobiles,
  });
  notifier.SendMessage(`老婆好`.trim());

  // console.log('加载客户端...');
  // const client = new binance({
  //   apiKey: secret.API_KEY,
  //   secret: secret.SECRET_KEY,
  //   enableRateLimit: true,
  // });
  // await client.loadMarkets();
  // console.log('客户端加载完成');
  // const executor = new BinanceSpot('BTC/USDT', client, 3, 'tn_log.json');
  // const robot = new TwoMaCross(executor, 10, 30);
  // setInterval(async () => {
  //   try {
  //     const list = await client.fetchOHLCV('BTC/USDT', '1m', undefined, robot.KLineReadyLength);
  //     const kline = ArrayToKLine(list);
  //     robot.CheckKLine(kline);
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }, 1000);
}

main();

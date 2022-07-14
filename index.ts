import { binance } from 'ccxt';
import secret from './.secret.json';
import dingtalk from './.dingtalk.json';
import { DingTalk } from './notifier/ding_talk';
import { BinanceSpot } from './executor/spot/binance_spot';
import { TwoMaCross } from './robot/spot/two_ma_cross';
import { ArrayToKLine } from './common/kline';

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
  const robot = new TwoMaCross(executor, 11, 21, notifier);
  setInterval(async () => {
    try {
      const list = await client.fetchOHLCV('ETH/USDT', '30m', undefined, robot.KLineReadyLength);
      const kline = ArrayToKLine(list);
      robot.CheckKLine(kline);
    } catch (e) {
      console.error(e);
    }
  }, 1000);
}

main();

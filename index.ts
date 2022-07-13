import { binance } from 'ccxt';
import secret from './.secret.json';
import dingtalk from './.dingtalk.json';
import { DingTalk } from './notifier/ding_talk';

async function main() {
  const notifier = new DingTalk({
    access_token: dingtalk.ACCESS_TOKEN,
    secret: dingtalk.SECRET,
    at_mobiles: dingtalk.AT_MOBILES,
  });
  notifier.SendMessage(`测试`.trim());

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

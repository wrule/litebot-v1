import { binance } from 'ccxt';
import secret from './.secret.json';
import { BinanceSpot } from './executor/spot/binance_spot';
import { retryer } from './utils/retryer';
import { write_list, read_list, append_list, delete_list } from './utils/json_list';

async function main() {
  console.log('加载客户端...');
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  await client.loadMarkets();
  console.log('客户端加载完成');
  const executor = new BinanceSpot('LINK/USDT', client, 3);
  await executor.BuyAll();
}

// main();

async function test() {

  // append_list('a.json', { name: '大傻逼', })

  delete_list('a.json', (item: any) => item.name === '似的是');

  const list = read_list('a.json');
  console.log(list);

  // function func(a: number, b: string, c: string) {
  //   console.log(`调用：${a} + ${b} = ${a + b}`);
  //   throw '错误';
  //   return a + b;
  // }

  // try {
  //   const result = await retryer(func, [1, 'string', 'dd'], 2);
  //   console.log(`结果：${result}`);
  // } catch (error) {
  //   console.log(error);
  // }
}

test();

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
  const executor = new BinanceSpot('LINK/USDT', client, 3, 'tn_log.json');
  await executor.sell_all();
}

main();

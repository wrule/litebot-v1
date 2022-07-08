import { binance } from 'ccxt';
import secret from './.secret.json';
import { BinanceSpot } from './executor/spot/binance_spot';

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

main();

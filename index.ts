import { binance } from 'ccxt';
import secret from './.secret.json';
import { BinanceSpot } from './executor/spot/binance_spot';

async function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  await client.loadMarkets();
  console.log(1234);
  const executor = new BinanceSpot({
    client,
    symbol: 'ETH/USDT',
    init_funds: 1000,
    init_assets: 0,
  });
  await executor.SelfCheck();
}

main();

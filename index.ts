import { binance } from 'ccxt';
import secret from './.secret.json';
import { BinanceSpot } from './executor/spot/binance_spot';

async function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  console.log('加载市场');
  await client.loadMarkets();
  console.log('加载完成');
  const executor = new BinanceSpot({
    client,
    symbol: 'ETH/USDT',
    init_funds_amount: 0,
    init_assets_amount: 0.0216555,
  });
  await executor.SellAll();
  executor.SyncAccount();
}

main();

import { binance } from 'ccxt';
import secret from './.secret.json';
import { ITransaction } from './common/transaction';
import { BinanceSpot } from './executor/spot/binance_spot';
import { JSONList } from './utils/list/json_list';
import { Logger } from './utils/logger';

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
    init_assets_amount: 0.023702,
    transaction_list: new JSONList<ITransaction>('output/tn.json'),
    logger: new Logger(),
  });
  // await executor.Buy(11);
  // await executor.Buy(12);
  // await executor.BuyAll();
  await executor.SellAll();
  await executor.SyncAccount();
}

main();

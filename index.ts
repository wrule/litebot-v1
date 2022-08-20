import { binance } from 'ccxt';
import secret from './.secret.json';
import { ISnapshot } from './common/snapshot';
import { ITransaction } from './common/transaction';
import { BinanceSpot } from './executor/spot/binance_spot';
import { JSONList } from './utils/list/json_list';
import { Logger } from './utils/logger';

async function main() {
  const logger = new Logger();
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  logger.log('加载市场');
  await client.loadMarkets();
  logger.log('加载完成');
  const executor = new BinanceSpot({
    client,
    symbol: 'OP/USDT',
    init_funds_amount: 20,
    init_assets_amount: 0,
    transaction_list: new JSONList<ITransaction>('output/op-tn.json'),
    snapshot_list: new JSONList<ISnapshot>('output/op-ss.json'),
    logger: new Logger(),
  });
  await executor.SyncAccount();
}

main();

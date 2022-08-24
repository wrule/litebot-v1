
import { ITransaction } from './common/transaction';
import { TestSpot } from './executor/spot/test_spot';
import { JSONList } from './utils/list/json_list';

async function main() {
  console.log('你好，世界');
  const spot = new TestSpot({
    symbol: 'BTC/USDT',
    init_funds_amount: 100,
    fee: 0.001,
    transaction_list: new JSONList<ITransaction>('output/ttn.json'),
  });
  spot.Reset();
  spot.BuyAll(10, 0);
  spot.SellAll(20, 0);
  console.log(spot.LatestSnapshot(1, 30));
}

main();

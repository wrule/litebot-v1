import { binance } from 'ccxt';
import { TickerWatcher } from '../watcher/ticker_watcher';
import { JSONList } from '../utils/list/json_list';

const symbol = 'OP/USDT';
const interval = 1000;

function main() {
  const client = new binance({ enableRateLimit: true });
  const watcher = new TickerWatcher(client, interval, symbol);
  const recorder = new JSONList(`output/${symbol.replace('/', '-')}.json`);
  watcher.Subscribe((ticker) => {
    recorder.Append([ticker.timestamp, ticker.close]);
  });
  watcher.Start();
}

main();

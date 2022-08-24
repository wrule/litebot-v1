#!/usr/bin/env node
import { binance } from 'ccxt';
import { TickerWatcher } from '../watcher/ticker_watcher';
import { JSONList } from '../utils/list/json_list';

function getArgs() {
  if (process.argv.length === 4) {
    const argvs = process.argv.slice(process.argv.length - 2);
    const symbol = argvs[0].toUpperCase();
    const interval = Number(argvs[1]);
    return { symbol, interval };
  }
  throw '参数错误';
}

function main() {
  const { symbol, interval } = getArgs();
  const client = new binance({ enableRateLimit: true });
  const watcher = new TickerWatcher(client, interval, symbol);
  const recorder = new JSONList(`output/${symbol.replace('/', '-')}.json`);
  watcher.Subscribe((ticker) => {
    recorder.Append([ticker.timestamp, ticker.close]);
  });
  watcher.Start();
}

main();

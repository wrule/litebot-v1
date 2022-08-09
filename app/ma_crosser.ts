#!/usr/bin/env node
import { App } from './app';
import { KLineWatcher } from '../watcher/kline_watcher';
import { binance } from 'ccxt';
import secret from '../.secret.json';

export
interface IConfig {
  symbol: string;
  timeframe: string;
  interval?: number;
  fast: number;
  slow: number;
  asset?: string;
  amount?: number;
}

export
class MACrosser
extends App {
  public constructor(
    private readonly config: IConfig,
  ) {
    super();
  }

  protected run(...args: string[]) {
    const client = new binance({
      apiKey: secret.API_KEY,
      secret: secret.SECRET_KEY,
      enableRateLimit: true,
    });
    const watcher = new KLineWatcher(
      client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      100,
    );
    watcher.Subscribe((kline_snapshot) => {
      console.log(kline_snapshot.confirmed_kline.length);
    });
    watcher.Start();
  }
}

const app = new MACrosser({
  symbol: 'BTC/USDT',
  timeframe: '2h',
  interval: 1000,
  fast: 8,
  slow: 49,
  asset: 'USDT',
  amount: 1000,
});

app.Run();

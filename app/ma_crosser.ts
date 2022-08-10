#!/usr/bin/env node
import { App } from './app';
import { KLineWatcher } from '../watcher/kline_watcher';
import { binance } from 'ccxt';
import secret from '../.secret.json';
import { DingTalk } from '../notifier/ding_talk';
import dingConfig from '../.dingtalk.json';
import { BinanceSpot } from '../executor/spot/binance_spot';
import { TwoMaCross } from '../robot/spot/two_ma_cross';

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

  protected async run(...args: string[]) {
    const ding = new DingTalk({
      secret: dingConfig.SECRET,
      access_token: dingConfig.ACCESS_TOKEN,
      at_mobiles: dingConfig.AT_MOBILES,
    });
    const client = new binance({
      apiKey: secret.API_KEY,
      secret: secret.SECRET_KEY,
      enableRateLimit: true,
    });
    await client.loadMarkets();
    const watcher = new KLineWatcher(
      client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      100,
    );
    const executor = new BinanceSpot(this.config.symbol, client, 3, 'tn.log');
    const robot = new TwoMaCross({ fast_ma: this.config.fast, slow_ma: this.config.slow }, executor, undefined, ding);
    watcher.Subscribe((kline_snapshot) => {
      robot.CheckKLine(kline_snapshot.confirmed_kline, kline_snapshot.last);
    });
    watcher.Start();
  }
}

const app = new MACrosser({
  symbol: 'ETH/USDT',
  timeframe: '1m',
  interval: 1000,
  fast: 9,
  slow: 44,
  asset: 'USDT',
  amount: 1000,
});

app.Run();

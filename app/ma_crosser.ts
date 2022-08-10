#!/usr/bin/env node
import { App } from './app';
import { KLineWatcher } from '../watcher/kline_watcher';
import { binance } from 'ccxt';
import secret from '../.secret.json';
import { DingTalk } from '../notifier/ding_talk';
import dingConfig from '../.dingtalk.json';
import { BinanceSpot } from '../executor/spot/binance_spot';
import { TwoMaCross } from '../robot/spot/two_ma_cross';
import { INotifier } from '../notifier';

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
  public constructor(private readonly config: IConfig) {
    super();
    this.notifier = new DingTalk({
      secret: dingConfig.SECRET,
      access_token: dingConfig.ACCESS_TOKEN,
      at_mobiles: dingConfig.AT_MOBILES,
    });
    this.client = new binance({
      apiKey: secret.API_KEY,
      secret: secret.SECRET_KEY,
      enableRateLimit: true,
    });
    this.watcher = new KLineWatcher(
      this.client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      100,
    );
    this.executor = new BinanceSpot(
      this.config.symbol,
      this.client,
      3,
      'tn.log',
    );
    this.robot = new TwoMaCross(
      { fast_ma: this.config.fast, slow_ma: this.config.slow },
      this.executor,
      undefined,
      this.notifier,
    );
  }

  private client!: binance;
  private notifier!: INotifier;
  private watcher!: KLineWatcher;
  private executor!: BinanceSpot;
  private robot!: TwoMaCross;

  protected async run(...args: string[]) {
    await this.client.loadMarkets();
    this.watcher.Subscribe((kline_snapshot) => {
      this.robot.CheckKLine(
        kline_snapshot.confirmed_kline,
        kline_snapshot.last,
      );
    });
    this.watcher.Start();
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

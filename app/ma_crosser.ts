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
  fast_ma: number;
  slow_ma: number;
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
    this.executor = new BinanceSpot(
      this.config.symbol,
      this.client,
      3,
      'tn.log',
    );
    this.robot = new TwoMaCross(
      { fast_ma: this.config.fast_ma, slow_ma: this.config.slow_ma },
      this.executor,
      undefined,
      this.notifier,
    );
    this.watcher = new KLineWatcher(
      this.client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      this.robot.KLineReadyLength + 1,
    );
  }

  private notifier!: INotifier;
  private client!: binance;
  private executor!: BinanceSpot;
  private robot!: TwoMaCross;
  private watcher!: KLineWatcher;

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
  symbol: 'ETH/USDC',
  timeframe: '1m',
  interval: 1000,
  fast_ma: 9,
  slow_ma: 44,
  asset: 'USDT',
  amount: 1000,
});

app.Run();

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
import { JSONList } from '../utils/list/json_list';
import { ITransaction } from '../common/transaction';
import { ISnapshot } from '../common/snapshot';
import { Logger, logger } from '../utils/logger';
import { SymbolPathization } from '../common/symbol';
import yargs from 'yargs/yargs';
import { hideBin }  from 'yargs/helpers';

export
interface IConfig {
  symbol: string;
  timeframe: string;
  interval?: number;
  fast_ma: number;
  slow_ma: number;
  funds: number;
  assets?: number;
}

export
class Strategy
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
    this.executor = new BinanceSpot({
      client: this.client,
      symbol: this.config.symbol,
      init_funds_amount: this.config.funds,
      init_assets_amount: this.config.assets,
      transaction_list: new JSONList<ITransaction>(`output/${SymbolPathization(this.config.symbol)}-tn.json`),
      snapshot_list: new JSONList<ISnapshot>(`output/${SymbolPathization(this.config.symbol)}-ss.json`),
      logger: new Logger(),
    });
    this.robot = new TwoMaCross({
      params: { fast_size: this.config.fast_ma, slow_size: this.config.slow_ma, },
      executor: this.executor,
      notifier: this.notifier,
    });
    this.watcher = new KLineWatcher(
      this.client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      this.robot.ReadyLength + 1,
    );
  }

  private notifier!: INotifier;
  private client!: binance;
  private executor!: BinanceSpot;
  private robot!: TwoMaCross;
  private watcher!: KLineWatcher;

  protected async run(...args: string[]) {
    await this.robot.Reset();
    this.logger.log('加载市场');
    await this.client.loadMarkets();
    this.logger.log('加载完成');
    this.watcher.Subscribe((kline_snapshot) => {
      this.robot.CheckHistoricalData(kline_snapshot.confirmed_kline);
    });
    this.watcher.Start();
  }
}

const config = {
  symbol: 'ETH/USDT',
  timeframe: '1m',
  interval: 1000,
  fast_ma: 9,
  slow_ma: 44,
  funds: 11,
  assets: 0,
  ...(yargs(hideBin(process.argv)).argv),
};

logger.log('配置:\n', config);

const app = new Strategy(config);

app.Run();

#!/usr/bin/env node
import { App } from './app';
import { KLineWatcher } from '../watcher/kline_watcher';
import { binance } from 'ccxt';
import { DingTalk } from '../notifier/ding_talk';
import { BinanceSpot } from '../executor/spot/binance_spot';
import { INotifier } from '../notifier';
import { JSONFileList } from '../utils/log_list/json_file_list';
import { ITransaction } from '../common/transaction';
import { ISnapshot } from '../common/snapshot';
import { Logger, logger } from '../utils/logger';
import { SymbolPathization } from '../common/symbol';
import yargs from 'yargs/yargs';
import { hideBin }  from 'yargs/helpers';
import { SRSI_Martin } from '../robot/spot/srsi_martin';

const secret = require('../.secret.json');
const dingConfig = require('../.dingtalk.json');

export
interface IConfig {
  symbol: string;
  timeframe: string;
  interval?: number;
  rsi_size: number;
  k_size: number;
  d_size: number;
  stoch_size: number;
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
      transaction_list: new JSONFileList<ITransaction>(`output/${SymbolPathization(this.config.symbol)}-tn.json`),
      snapshot_list: new JSONFileList<ISnapshot>(`output/${SymbolPathization(this.config.symbol)}-ss.json`),
      logger: new Logger(),
    });
    this.robot = new SRSI_Martin({
      params: {
        rsi_size: this.config.rsi_size,
        k_size: this.config.k_size,
        d_size: this.config.d_size,
        stoch_size: this.config.stoch_size,
      },
      executor: this.executor,
      notifier: this.notifier,
    });
    this.watcher = new KLineWatcher(
      this.client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      (this.robot.ReadyLength + 1) * 2,
    );
  }

  private notifier!: INotifier;
  private client!: binance;
  private executor!: BinanceSpot;
  private robot!: SRSI_Martin;
  private watcher!: KLineWatcher;

  protected async run(...args: string[]) {
    await this.executor.Reset();
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
  rsi_size: 13,
  k_size: 32,
  d_size: 45,
  stoch_size: 45,
  funds: 11,
  assets: 0,
  ...(yargs(hideBin(process.argv)).argv),
};

logger.log('配置:\n', config);

const app = new Strategy(config);

app.Run();

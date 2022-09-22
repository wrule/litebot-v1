#!/usr/bin/env node
import { App } from './app';
import { KLineWatcher } from '../watcher/kline_watcher';
import { binance } from 'ccxt';
import { DingTalk } from '../notifier/ding_talk';
import { BinanceSpot } from '../executor/spot/binance_spot';
import { TwoMaCross } from '../robot/spot/two_ma_cross_stop';
import { INotifier } from '../notifier';
import { ITransaction } from '../common/transaction';
import { ISnapshot } from '../common/snapshot';
import { Logger, logger } from '../utils/logger';
import { SymbolPathization } from '../common/symbol';
import yargs from 'yargs/yargs';
import { hideBin }  from 'yargs/helpers';
import { JSONFileList } from '../utils/log_list/json_file_list';
import { JSONFileReport } from '../report/json_file_report';
import moment from 'moment';

const secret = require('./.secret.json');
const dingConfig = require('./.dingtalk.json');

export
interface IConfig {
  name: string;
  symbol: string;
  timeframe: string;
  interval?: number;
  fast_ma: number;
  slow_ma: number;
  stop_rate: number;
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
      // transaction_list: new JSONFileList<ITransaction>(`output/${SymbolPathization(this.config.symbol)}-tn.json`),
      // snapshot_list: new JSONFileList<ISnapshot>(`output/${SymbolPathization(this.config.symbol)}-ss.json`),
      logger: new Logger(),
    });
    this.robot = new TwoMaCross({
      name: this.config.name,
      params: { fast_size: this.config.fast_ma, slow_size: this.config.slow_ma, stop_rate: this.config.stop_rate, },
      executor: this.executor,
      report: new JSONFileReport(`output/${SymbolPathization(this.config.symbol)}-report-${moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')}`),
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
    this.watcher.Subscribe((kline) => {
      this.robot.CheckKLine(kline);
    });
    this.watcher.Start();
  }
}

const config = {
  name: '墙头草',
  symbol: 'ETH/USDT',
  timeframe: '1m',
  interval: 1000,
  fast_ma: 9,
  slow_ma: 44,
  funds: 11,
  assets: 0,
  stop_rate: 0.03,
  ...(yargs(hideBin(process.argv)).argv),
};

logger.log('配置:', config);

const app = new Strategy(config);

app.Run();

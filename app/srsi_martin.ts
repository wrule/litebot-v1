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
  rsi_size: number;
  k_size: number;
  d_size: number;
  stoch_size: number;
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
    this.robot = new SRSI_Martin({
      name: this.config.name,
      params: {
        rsi_size: this.config.rsi_size,
        k_size: this.config.k_size,
        d_size: this.config.d_size,
        stoch_size: this.config.stoch_size,
        stop_rate: this.config.stop_rate,
      },
      executor: this.executor,
      report: new JSONFileReport(`output/${SymbolPathization(this.config.symbol)}-report-${moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')}`),
      notifier: this.notifier,
    });
    this.watcher = new KLineWatcher(
      this.client,
      this.config.interval,
      this.config.symbol,
      this.config.timeframe,
      (this.robot.ReadyLength + 1) * 5,
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
    this.watcher.Subscribe((kline) => {
      this.robot.CheckKLine(kline);
    });
    this.watcher.Start();
  }
}

const config = {
  name: '红眼',
  symbol: 'KP3R/BUSD',
  timeframe: '1h',
  interval: 1000,
  rsi_size: 108,
  k_size: 12,
  d_size: 116,
  stoch_size: 21,
  stop_rate: 0.3,
  funds: 11,
  assets: 0,
  ...(yargs(hideBin(process.argv)).argv),
};

logger.log('配置:', config);

const app = new Strategy(config);

app.Run();

import { IOHLCV, ITimeClose } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '@/executor/spot';
import { ITransaction } from '@/common/transaction';
import { ISnapshot } from '@/common/snapshot';
import moment from 'moment';

/**
 * 现货机器人配置
 */
export
interface ISpotRobotConfig<
  Params,
  InputData extends IOHLCV,
  SignalData extends InputData,
  Snapshot extends ISnapshot,
> {
  name?: string,
  params: Params,
  executor: ISpotExecutor,
  notifier?: INotifier,
  report?: Report<Params, InputData, SignalData, Snapshot>,
}

/**
 * 现货机器人抽象类
 */
export
abstract class SpotRobot<
  Params,
  InputData extends IOHLCV,
  SignalData extends InputData,
  Snapshot extends ISnapshot,
> {
  public constructor(protected config: ISpotRobotConfig<Params, InputData, SignalData, Snapshot>) { }

  protected logger = new Logger();

  private used_game_id = -1;
  private current_game_id: number | null = null;

  protected game_open() {
    this.used_game_id++;
    this.current_game_id = this.used_game_id;
    return this.current_game_id;
  }

  protected game_change(game_id: number) {
    this.current_game_id = game_id;
  }

  private fill_game_id(tn: ITransaction | null) {
    if (tn && this.current_game_id != null) tn.game_id = this.current_game_id;
  }

  //#region 子类需实现部分
  /**
   * 计算可用信号所需要的最小数据长度
   */
  protected abstract ready_length(): number;
  /**
   * 生成信号数据
   * @param historical_data 历史数据
   * @returns 信号数据
   */
  protected abstract generate_signal_data(historical_data: InputData[]): SignalData[];
  /**
   * 历史信号行为
   * @param signal 最新的历史信号
   */
  protected abstract signal_action(signal: SignalData): Promise<ITransaction | undefined>;
  /**
   * 活跃信号行为
   * @param signal 活跃信号
   * @param lagging 是否为延后信号(回测用)
   */
  protected async stop_signal_action(signal: ITimeClose, lagging?: boolean): Promise<ITransaction | undefined> {
    return undefined;
  };
  //#endregion

  //#region 对外暴露的方法
  public async SendMessage(message: string) {
    await this.config.notifier?.SendMessage(message);
  }
  /**
   * 计算可用信号所需要的最小数据长度
   */
  public get ReadyLength() {
    return this.ready_length();
  }
  /**
   * 第一个可用信号的数据索引
   */
  public get ReadyIndex() {
    return this.ReadyLength - 1;
  }
  /**
   * 生成信号数据
   * @param historical_data 历史数据
   * @returns 信号数据
   */
  public GenerateSignalData(historical_data: InputData[]) {
    return this.generate_signal_data(historical_data);
  }
  /**
   * 重置回测状态
   */
  public async Reset(): Promise<SpotRobot<Params, InputData, SignalData, Snapshot>> {
    this.used_game_id = -1;
    this.current_game_id = null;
    this.historical_last_time = -1;
    this.signal_data = [];
    this.current_index = 0;
    await this.config.executor.Reset();
    return this;
  }
  //#endregion

  //#region 内部方法
  /**
   * 便利的信号数据填充工具方法
   * @param historical_data 历史数据
   * @param filler 信号填充函数
   * @returns 信号数据
   */
  protected fill_signal_data(
    historical_data: InputData[],
    filler: (data: SignalData, index: number) => void,
  ): SignalData[] {
    return historical_data.map((history, index) => {
      const signal = { ...history } as SignalData;
      if (index >= this.ReadyIndex) filler(signal, index);
      return signal;
    });
  }
  /**
   * 默认的交易消息方法，可在子类中覆盖
   * @param tn 交易数据
   */
  protected async transaction_message(tn: ITransaction) {
    const time = moment(new Date(tn.transaction_time)).format('HH:mm:ss');
    const action = { 'BUY' : '买了', 'SELL' : '卖了' }[tn.action];
    const icon_face = { 'BUY' : '🤔', 'SELL' : '😱' }[tn.action];
    const icon_action = { 'BUY' : '🚀', 'SELL' : '💰' }[tn.action];
    const seconds = Number(((tn.transaction_time - tn.request_time) / 1000).toFixed(3));
    await this.SendMessage(`[${this.config.name}${action}${icon_face}  交易时间: ${time}]\n[成交价: ${tn.price}  期望价: ${tn.expected_price}  走单耗时: ${seconds}s]\n使用 ${tn.in_amount}个${tn.in_name} ${action}${icon_action} ${tn.out_amount}个${tn.out_name}`);
  }
  //#endregion

  //#region 实盘运行相关
  /**
   * 记录最后一个实盘历史数据的时间
   */
  private historical_last_time = -1;

  /**
   * 实盘K线检查
   * @param kline 实盘K线
   */
  public async CheckKLine(kline: InputData[]): Promise<void> {
    try {
      // 为空则弃用
      if (kline.length < 1) return;
      // 历史蜡烛列表
      const historical_candles = kline.slice(0, kline.length - 1);
      // 活跃蜡烛
      const active_candle = kline[kline.length - 1];
      // 最后一个历史蜡烛
      const last_historical_candle = (kline[kline.length - 2] || null) as InputData | null;
      // 活跃信号
      const active_signal = { time: active_candle.time, close: active_candle.close } as ITimeClose;
      // 历史信号
      let last_historical_signal = last_historical_candle as SignalData | null;
      // 准备交易
      let tn: ITransaction | null = null;
      // 备份历史时间
      const prev_historical_last_time = this.historical_last_time;
      if (last_historical_candle && last_historical_candle.time > this.historical_last_time) {
        this.historical_last_time = last_historical_candle.time;
        // 计算信号
        const signal_data = this.generate_signal_data(historical_candles);
        last_historical_signal = signal_data[signal_data.length - 1] || last_historical_signal;
        // 发出历史信号
        setImmediate(() => this.logger.log('历史信号:', last_historical_signal));
        tn = (await this.signal_action(last_historical_signal)) || null;
      } else {
        // 发出活跃信号
        setImmediate(() => this.logger.log('活跃信号:', active_signal));
        tn = (await this.stop_signal_action(active_signal)) || null;
      }
      // 尝试填充赌局信息
      this.fill_game_id(tn);
      // 是否产生了新的历史数据
      const new_history = this.historical_last_time > prev_historical_last_time;
      // 数据后置记录
      await Promise.all([
        new_history && this.config.report?.HistoricalData?.Append(...historical_candles.filter((history) => history.time > prev_historical_last_time)),
        new_history && this.config.report?.SignalData?.Append(last_historical_signal as SignalData),
        new_history && this.config.report?.Snapshots?.Append({
          time: last_historical_candle?.time,
          valuation: await this.config.executor.Valuation(last_historical_candle?.close),
        } as Snapshot),
        tn && this.config.report?.Transactions?.Append(tn),
        tn && this.transaction_message(tn),
      ]);
    } catch (e) {
      this.logger.error(e);
    }
  }
  //#endregion

  //#region 回测运行相关
  /**
   * 用于回测的信号数据
   */
  private signal_data: SignalData[] = [];
  /**
   * 信号数据当前索引
   */
  private current_index = 0;
  /**
   * 回溯获取信号数据
   * @param offset 偏移量
   * @returns 信号数据
   */
  protected look_back(offset = 0) {
    if (offset < 0) throw 'offset必须大于等于0';
    const dst_index = this.current_index - offset;
    if (dst_index < 0) throw 'dst_index必须大于等于0';
    return this.signal_data[dst_index];
  }
  /**
   * 信号数据回测
   * @param signal_data 信号数据
   */
  public async BackTestingSignal(signal_data: SignalData[]) {
    await this.Reset();
    this.signal_data = signal_data;
    await Promise.all([
      (async () => {
        for (let i = 0; i < this.signal_data.length; ++i) {
          this.current_index = i;
          const last_signal = this.look_back();
          let tns: (ITransaction | null)[] = [];
          tns.push((await this.stop_signal_action({ time: last_signal.time, close: last_signal.open })) || null);
          tns.push((await this.stop_signal_action({ time: last_signal.time, close: last_signal.low }, true)) || null);
          tns.push((await this.signal_action(last_signal)) || null);
          tns = tns.filter((tn) => tn);
          tns.forEach((tn) => this.fill_game_id(tn));
          await Promise.all([
            tns.length > 0 && this.config.report?.Transactions?.Append(...(tns as ITransaction[])),
            this.config.report?.Snapshots?.Append({
              time: last_signal.time,
              valuation: await this.config.executor.Valuation(last_signal.close),
            } as Snapshot),
          ]);
        }
      })(),
      this.config?.report?.SignalData?.Replace(signal_data),
    ]);
  }
  /**
   * 历史数据回测
   * @param historical_data 历史数据
   */
  public async BackTesting(historical_data: InputData[]) {
    await Promise.all([
      this.BackTestingSignal(this.generate_signal_data(historical_data)),
      this.config?.report?.HistoricalData?.Replace(historical_data),
    ]);
  }
  //#endregion
}

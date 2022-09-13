import { ITimeClose } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '../../executor/spot';
import { ITransaction } from '@/common/transaction';
import moment from 'moment';
import { ISnapshot } from '@/common/snapshot';

export
interface ISpotRobotConfig<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
> {
  name: string,
  params: Params,
  executor: ISpotExecutor,
  notifier?: INotifier,
  report?: Report<Params, HistoricalData, SignalData, Snapshot>,
}

export
abstract class SpotRobot<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
  Snapshot extends ISnapshot,
> {
  public constructor(protected config: ISpotRobotConfig<Params, HistoricalData, SignalData, Snapshot>) { }

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
  protected abstract generate_signal_data(historical_data: HistoricalData[]): SignalData[];
  /**
   * 信号行为
   * @param signal 最新的信号
   */
  protected abstract signal_action(signal: SignalData): Promise<ITransaction | undefined>;
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
  public GenerateSignalData(historical_data: HistoricalData[]) {
    return this.generate_signal_data(historical_data);
  }
  /**
   * 重置回测状态
   */
  public async Reset(): Promise<SpotRobot<Params, HistoricalData, SignalData, Snapshot>> {
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
    historical_data: HistoricalData[],
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
   * 检查实盘历史数据
   * @param historical_data 实盘历史数据
   */
  public async CheckKLine(kline: HistoricalData[]): Promise<void> {
    try {
      if (kline.length < 1) return;
      // 历史蜡烛列表
      const historical_candles = kline.slice(0, kline.length - 1);
      // 最后一个历史蜡烛
      const last_historical_candle: HistoricalData | null = historical_candles[historical_candles.length - 1] || null;
      // 活跃蜡烛
      const active_candle = kline[kline.length - 1];

      // 历史信号
      let last_historical_signal: SignalData | null = last_historical_candle as SignalData | null;
      // 活跃信号
      let active_signal: SignalData = active_candle as SignalData;

      // 计算信号
      if (kline.length >= this.ReadyLength) {
        const signal_data = this.generate_signal_data(kline);
        last_historical_signal = signal_data[signal_data.length - 2] || last_historical_signal;
        active_signal = signal_data[signal_data.length - 1] || active_signal;
      }

      // 发现新的历史数据
      if (last_historical_candle?.time > this.historical_last_time) {
        const prev_historical_last_time = this.historical_last_time;
        this.historical_last_time = last_historical_candle.time;
        let last_signal: SignalData | null = null;
        let tn: ITransaction | null = null;
        if (kline.length >= this.ReadyLength) {
          const signal_data = this.generate_signal_data(kline);
          last_signal = signal_data[signal_data.length - 1];
          setImmediate(() => this.logger.log('新信号:', last_signal));
          tn = (await this.signal_action(last_signal)) || null;
          this.fill_game_id(tn);
        }
        await Promise.all([
          this.config?.report?.HistoricalData?.Append(...kline.filter((history) => history.time > prev_historical_last_time)),
          last_signal && this.config.report?.SignalData?.Append(last_signal),
          tn && this.config.report?.Transactions?.Append(tn),
          this.config.report?.Snapshots?.Append({
            time: last_historical_candle.time,
            valuation: await this.config.executor.Valuation(),
          } as Snapshot),
          tn && this.transaction_message(tn),
        ]);
      }

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
          const tn = (await this.signal_action(last_signal)) || null;
          this.fill_game_id(tn);
          await Promise.all([
            tn && this.config.report?.Transactions?.Append(tn),
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
  public async BackTesting(historical_data: HistoricalData[]) {
    await Promise.all([
      this.BackTestingSignal(this.generate_signal_data(historical_data)),
      this.config?.report?.HistoricalData?.Replace(historical_data),
    ]);
  }
  //#endregion
}

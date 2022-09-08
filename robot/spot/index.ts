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
  protected transaction_message(tn: ITransaction) {
    const time = moment(new Date(tn.transaction_time)).format('HH:mm:ss');
    const icon = { 'BUY' : '🚀', 'SELL' : '💰' }[tn.action];
    const action = { 'BUY' : '🤔买了', 'SELL' : '😱卖了' }[tn.action];
    const seconds = Number(((tn.transaction_time - tn.request_time) / 1000).toFixed(3));
    this.SendMessage(`[${icon} ${time} 耗时: ${seconds}s]\n使用  ${tn.in_amount}个${tn.in_name}   ${action}   ${tn.out_amount}个${tn.out_name}\n期望价格: ${tn.expected_price}   成交价格: ${tn.price}`);
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
  public async CheckHistoricalData(historical_data: HistoricalData[]): Promise<void> {
    try {
      if (historical_data.length < 1) return;
      const last_history = historical_data[historical_data.length - 1];
      if (last_history.time > this.historical_last_time) {
        const prev_historical_last_time = this.historical_last_time;
        setImmediate(() => {
          const append_history = historical_data.filter((history) => history.time > prev_historical_last_time);
          this.config?.report?.HistoricalData?.Append(...append_history);
        });
        this.historical_last_time = last_history.time;
        if (historical_data.length >= this.ReadyLength) {
          const signal_data = this.generate_signal_data(historical_data);
          const last_signal = signal_data[signal_data.length - 1];
          setImmediate(() => {
            this.logger.log('新信号:', last_signal);
            this.config.report?.SignalData?.Append(last_signal);
          });
          const tn = await this.signal_action(last_signal);
          if (tn) this.config.report?.Transactions?.Append(tn);
          if (tn) this.transaction_message(tn);
        }
        this.config.report?.Snapshots?.Append({
          time: Number(new Date()),
          valuation: await this.config.executor.Valuation(),
        } as Snapshot);
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
      this.config?.report?.SignalData?.Replace(signal_data),
      async () => {
        for (let i = 0; i < this.signal_data.length; ++i) {
          this.current_index = i;
          const last_signal = this.look_back();
          const tn = await this.signal_action(last_signal);
          if (tn) this.config.report?.Transactions?.Append(tn);
          this.config.report?.Snapshots?.Append({
            time: last_signal.time,
            valuation: await this.config.executor.Valuation(last_signal.close),
          } as Snapshot);
        }
      },
    ]);
  }
  /**
   * 历史数据回测
   * @param historical_data 历史数据
   */
  public async BackTesting(historical_data: HistoricalData[]) {
    await Promise.all([
      this.config?.report?.HistoricalData?.Replace(historical_data),
      this.BackTestingSignal(this.generate_signal_data(historical_data)),
    ]);
  }
  //#endregion
}

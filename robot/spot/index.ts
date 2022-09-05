import { ITimeClose } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '../../executor/spot';
import { ITransaction } from '@/common/transaction';

export
interface ISpotRobotConfig<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
> {
  params: Params,
  executor: ISpotExecutor,
  notifier?: INotifier,
  report?: Report<Params, HistoricalData, SignalData>,
}

export
abstract class SpotRobot<
  Params,
  HistoricalData extends ITimeClose,
  SignalData extends HistoricalData,
> {
  public constructor(protected config: ISpotRobotConfig<Params, HistoricalData, SignalData>) { }

  protected logger = new Logger();

  //#region 消息通知部分
  public async SendMessage(message: string) {
    await this.config.notifier?.SendMessage(message);
  }
  //#endregion

  /**
   * 计算可用信号所需要的最小数据长度
   */
  public abstract ReadyLength: number;

  /**
   * 第一个可用信号的数据索引
   */
  public get ReadyIndex() {
    return this.ReadyLength - 1;
  }

  protected abstract signal_action(signal: SignalData): Promise<ITransaction | undefined>;

  protected abstract transaction_message(tn: ITransaction): Promise<void>;

  //#region 实盘运行相关
  private kline_last_time = -1;

  public async CheckHistoricalData(historical_data: HistoricalData[]): Promise<void> {
    if (historical_data.length < 1) return;
    const last_historical = historical_data[historical_data.length - 1];
    if (last_historical.time > this.kline_last_time) {
      if (historical_data.length >= this.ReadyLength) {
        const signal_data = this.generate_signal_data(historical_data);
        const last_signal = signal_data[signal_data.length - 1];
        const tn = await this.signal_action(last_signal);
        if (tn) this.transaction_message(tn);
      }
      await this.config.report?.AppendRealData(
        ...historical_data.filter((item) => item.time > this.kline_last_time)
      );
      this.kline_last_time = last_historical.time;
    }
  }
  //#endregion

  //#region 回测运行相关
  /**
   * 用于回测的历史数据
   */
  private signal_data: SignalData[] = [];
  /**
   * 历史数据当前索引
   */
  private current_index = 0;
  /**
   * 重置回测状态
   */
  public async Reset(): Promise<SpotRobot<Params, HistoricalData, SignalData>> {
    this.kline_last_time = -1;
    this.current_index = 0;
    this.signal_data = [];
    await this.config.executor.Reset();
    return this;
  }
  /**
   * 回溯获取测试数据
   * @param offset 偏移量
   * @returns 测试数据
   */
  protected last(offset = 0) {
    if (offset < 0) {
      throw 'offset必须大于等于0';
    }
    const dst_index = this.current_index - offset;
    if (dst_index < 0) {
      throw 'dst_index必须大于等于0';
    }
    return this.signal_data[dst_index];
  }
  /**
   * 上一个测试数据
   * @returns 测试数据
   */
  protected prev() {
    return this.last(1);
  }
  /**
   * 测试数据回测
   * @param signal_data 测试数据
   */
  public async BackTestingBasic(signal_data: SignalData[]) {
    await this.Reset();
    this.signal_data = signal_data;
    for (let i = 0; i < this.signal_data.length; ++i) {
      this.current_index = i;
      const last = this.last();
      await this.signal_action(last);
      await this.config.executor.UpdateSnapshot(last.time, last.close);
    }
  }
  /**
   * 真实数据回测
   * @param historical_data 真实数据
   */
  public async BackTesting(historical_data: HistoricalData[]) {
    const signal_data = this.generate_signal_data(historical_data);
    await this.BackTestingBasic(signal_data);
  }
  /**
   * 生成信号数据
   * @param historical_data 历史数据
   * @returns 信号数据
   */
  public abstract generate_signal_data(historical_data: HistoricalData[]): SignalData[];
  //#endregion

  //#region 工具方法
  protected gold_cross(
    fast_prev: number,
    slow_prev: number,
    fast_last: number,
    slow_last: number,
  ) {
    return (fast_prev <= slow_prev) && (fast_last > slow_last);
  }

  protected gold_cross_line(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return this.gold_cross(fast_prev, slow_prev, fast_last, slow_last);
  }

  protected dead_cross(
    fast_prev: number,
    slow_prev: number,
    fast_last: number,
    slow_last: number,
  ) {
    return (fast_prev >= slow_prev) && (fast_last < slow_last);
  }

  protected dead_cross_line(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return this.dead_cross(fast_prev, slow_prev, fast_last, slow_last);
  }
  //#endregion
}

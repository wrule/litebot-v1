import { ITimeClose } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '../../executor/spot';
import { ITransaction } from '@/common/transaction';
import moment from 'moment';

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

  /**
   * 生成信号数据
   * @param historical_data 历史数据
   * @returns 信号数据
   */
  public abstract generate_signal_data(historical_data: HistoricalData[]): SignalData[];

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

  protected abstract signal_action(signal: SignalData): Promise<ITransaction | undefined>;

  /**
   * 默认的交易消息方法，可在子类中覆盖
   * @param tn 交易数据
   */
  protected transaction_message(tn: ITransaction) {
    const time = moment(new Date(tn.transaction_time)).format('HH:mm:ss');
    const icon = { 'BUY' : '🤔', 'SELL' : '😱' }[tn.action];
    const action = { 'BUY' : '买', 'SELL' : '卖' }[tn.action];
    const seconds = Number(((tn.transaction_time - tn.request_time) / 1000).toFixed(3));
    this.SendMessage(`[${icon} ${time} ${seconds}s]\n使用 ${tn.in_amount} 个 ${tn.in_name} ${action}了 ${tn.out_amount} 个 ${tn.out_name}`);
  }

  //#region 实盘运行相关
  private kline_last_time = -1;

  public async CheckHistoricalData(historical_data: HistoricalData[]): Promise<void> {
    if (historical_data.length < 1) return;
    const last_history = historical_data[historical_data.length - 1];
    if (last_history.time > this.kline_last_time) {
      if (historical_data.length >= this.ReadyLength) {
        const signal_data = this.generate_signal_data(historical_data);
        const last_signal = signal_data[signal_data.length - 1];
        const tn = await this.signal_action(last_signal);
        if (tn) this.transaction_message(tn);
      }
      await this.config.report?.AppendRealData(
        ...historical_data.filter((item) => item.time > this.kline_last_time)
      );
      this.kline_last_time = last_history.time;
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
  //#endregion
}

import { IOHLCV, KLine } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '../../executor/spot';
import { ITransaction } from '../../common/transaction';

export
abstract class SpotRobot<
  Params,
  RealData extends IOHLCV,
  TestData extends IOHLCV,
> {
  public constructor(
    protected params: Params,
    protected executor: ISpotExecutor,
    protected report?: Report<Params, RealData, TestData>,
    private notifier?: INotifier,
  ) { }

  protected logger = new Logger();

  public get Executor() {
    return this.executor;
  }

  //#region 消息通知部分
  public async SendMessage(message: string) {
    await this.notifier?.SendMessage(message);
  }
  //#endregion

  public abstract KLineReadyLength: number;

  public get KLineReadyIndex() {
    return this.KLineReadyLength - 1;
  }

  //#region 实盘运行
  private kline_last_time = -1;

  public async CheckKLine(confirmed_kline: RealData[]): Promise<void> {
    if (confirmed_kline.length < 1) return;
    const last_confirmed = confirmed_kline[confirmed_kline.length - 1];
    if (last_confirmed.time > this.kline_last_time) {
      if (confirmed_kline.length >= this.KLineReadyLength) {
        await this.checkKLine(confirmed_kline, last_confirmed);
      }
      await this.report?.AppendRealData(
        ...confirmed_kline.filter((item) => item.time > this.kline_last_time)
      );
      this.kline_last_time = last_confirmed.time;
    }
  }

  protected abstract checkKLine(confirmed_kline: RealData[], last_confirmed: RealData): Promise<void>;
  //#endregion

  //#region 回测运行
  /**
   * 用于回测的历史数据
   */
  private test_data: TestData[] = [];
  /**
   * 历史数据当前索引
   */
  private current_index = 0;
  /**
   * 重置回测状态
   */
  public async Reset() {
    this.kline_last_time = -1;
    this.current_index = 0;
    this.test_data = [];
    await this.executor.Reset();
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
    return this.test_data[dst_index];
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
   * @param test_data 测试数据
   */
  public async BackTestingBasic(test_data: TestData[]) {
    await this.Reset();
    this.test_data = test_data;
    for (let i = 0; i < this.test_data.length; ++i) {
      this.current_index = i;
      const last = this.last();
      await this.checkTestData(last);
      await this.executor.UpdateSnapshot(last.time, last.close);
    }
  }
  /**
   * 真实数据回测
   * @param real_data 真实数据
   */
  public async BackTesting(real_data: RealData[]) {
    const test_data = this.generateTestData(real_data);
    await this.BackTestingBasic(test_data);
  }
  /**
   * 生成测试数据
   * @param real_data 真实历史数据
   * @returns 测试数据
   */
  protected abstract generateTestData(real_data: RealData[]): TestData[];
  /**
   * 检查测试数据
   * @param data 测试数据
   */
  protected abstract checkTestData(data: TestData): void | Promise<void>;
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

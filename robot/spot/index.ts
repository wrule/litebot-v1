import { IOHLCV, KLine } from '@/common/kline';
import { INotifier } from '@/notifier';
import { Report } from '@/report';
import { Logger } from '../../utils/logger';
import { ISpotExecutor } from '../../executor/spot';

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

  public abstract KLineReadyLength: number;

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
  public Reset() {
    this.current_index = 0;
    // TODO
    // this.executor.Reset();
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
   * 检查测试数据
   * @param data 测试数据
   */
  protected abstract checkTestData(data: TestData): void;

  /**
   * 生成测试数据
   * @param realData 输入历史数据
   */
  protected abstract GenerateTestData(realData: RealData[]): TestData[];

  /**
   * 测试数据回测
   * @param testData 测试数据
   */
  public BackTestingBasic(testData: TestData[]) {
    this.testData = testData;
    this.Reset();
    for (let i = 0; i < this.testData.length; ++i) {
      this.currentIndex = i;
      const last = this.last();
      this.checkTestData(last);
      // TODO
      // this.executor.UpdateSnapshot(last.close);
    }
  }

  /**
   * 真实数据回测
   * @param real_data 真实数据
   */
  public BackTesting(real_data: RealData[]) {
    const test_data = this.GenerateTestData(real_data);
    return this.BackTestingBasic(test_data);
  }
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

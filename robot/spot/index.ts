import { IOHLCV, KLine } from '@/common/kline';
import { INotifier } from '@/notifier';
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
    private notifier?: INotifier,
  ) { }

  //#region 消息通知部分
  public async SendMessage(message: string) {
    if (this.notifier) {
      await this.notifier.SendMessage(message);
    }
  }
  //#endregion

  //#region 实盘运行
  private kline_last_time = -1;

  public abstract KLineReadyLength: number;

  public CheckKLine(kline: RealData[]) {
    if (kline.length >= this.KLineReadyLength) {
      const last = kline[kline.length - 1];
      if (last.time > this.kline_last_time) {
        this.kline_last_time = last.time;
        const confirmed_kline = kline.filter((item) => item.confirmed);
        this.checkKLine(confirmed_kline, last, kline);
      }
    }
  }

  protected abstract checkKLine(
    confirmed_kline: RealData[],
    last: RealData,
    kline: RealData[],
  ): void;
  //#endregion

  //#region 回测逻辑
  /**
   * 用于回测的历史数据
   */
  private testKLine: TestData[] = [];
  /**
   * 历史数据当前索引
   */
  private currentIndex = 0;

  /**
   * 回溯获取测试数据
   * @param offset 偏移量
   * @returns 测试数据
   */
  protected last(offset = 0) {
    if (offset < 0) {
      throw 'offset必须大于等于0';
    }
    const dstIndex = this.currentIndex - offset;
    if (dstIndex < 0) {
      throw 'dstIndex必须大于等于0';
    }
    return this.testKLine[dstIndex];
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
   * @param kline 输入历史数据
   */
  protected abstract generateTestData(kline: RealData[]): TestData[];

  /**
   * 回测
   * @param kline 历史数据
   */
  public BackTesting(kline: RealData[]) {
    this.testKLine = this.generateTestData(kline);
    for (let i = 0; i < this.testKLine.length; ++i) {
      this.currentIndex = i;
      this.checkTestData(this.last());
    }
  }
  //#endregion

  public Buy(
    in_asset: number,
    price?: number,
    time?: number,
  ) {
    return this.executor.Buy(in_asset, price, time);
  }

  public BuyAll(
    price?: number,
    time?: number,
  ) {
    return this.executor.BuyAll(price, time);
  }

  public Sell(
    in_asset: number,
    price?: number,
    time?: number,
  ) {
    return this.executor.Sell(in_asset, price, time);
  }

  public SellAll(
    price?: number,
    time?: number,
  ) {
    return this.executor.SellAll(price, time);
  }

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

import { IOHLCV, KLine } from '@/common/kline';
import { INotifier } from '@/notifier';
import { ISpotExecutor } from '../../executor/spot';

export
abstract class SpotRobot<TestData extends IOHLCV> {
  public constructor(
    protected executor: ISpotExecutor,
    protected notifier?: INotifier,
  ) { }

  public async SendMessage(message: string) {
    if (this.notifier) {
      await this.notifier.SendMessage(message);
    }
  }

  private kline_last_time = -1;

  public abstract KLineReadyLength: number;

  public CheckKLine<T extends KLine>(kline: T) {
    if (kline.length >= this.KLineReadyLength) {
      const last = kline[kline.length - 1];
      if (last.time > this.kline_last_time) {
        this.kline_last_time = last.time;
        const confirmed_kline = kline.filter((item) => item.confirmed);
        this.checkKLine(confirmed_kline, last, kline);
      }
    }
  }

  protected abstract checkKLine<T extends IOHLCV>(
    confirmed_kline: T[],
    last: T,
    kline: T[],
  ): void;

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
   * 回测
   * @param kline 历史数据
   */
  public BackTesting(kline: TestData[]) {
    this.testKLine = kline;
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

  protected gold_cross(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return (fast_prev <= slow_prev) && (fast_last > slow_last);
  }

  protected dead_cross(
    fast_line: number[],
    slow_line: number[],
  ) {
    const fast_prev = fast_line[fast_line.length - 2];
    const slow_prev = slow_line[slow_line.length - 2];
    const fast_last = fast_line[fast_line.length - 1];
    const slow_last = slow_line[slow_line.length - 1];
    return (fast_prev >= slow_prev) && (fast_last < slow_last);
  }
}

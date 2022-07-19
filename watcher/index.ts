
/**
 * 监听回调函数
 */
export
type WatcherCallBack<T> = (data: T) => void;

/**
 * 监听者抽象类
 */
export
abstract class Watcher<T> {
  private callback_map = new Map<WatcherCallBack<T>, void>();

  /**
   * 订阅更新
   * @param callback 回调函数
   */
  public Subscribe(callback: WatcherCallBack<T>) {
    this.callback_map.set(callback);
  }

  /**
   * 取消订阅
   * @param callback 回调函数
   */
  public Unsubscribe(callback: WatcherCallBack<T>) {
    this.callback_map.delete(callback);
  }

  /**
   * 更新数据方法
   * @param data 数据
   */
  protected update(data: T) {
    Array.from(this.callback_map.keys())
      .forEach((callback) => {
        callback(data);
      });
  }

  /**
   * 运行监听者
   */
  public abstract Start(): void;

  /**
   * 关闭监听者
   */
  public abstract Stop(): void;
}

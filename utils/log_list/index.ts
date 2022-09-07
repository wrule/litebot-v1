/**
 * 日志列表，一种主要是追加和读取操作的列表接口定义
 */
export
interface ILogList<T> {
  /**
   * 追加数据
   * @param data 数据
   */
  Append(...data: T[]): void | Promise<void>;
  /**
   * 读取所有数据
   */
  All(): T[] | Promise<T[]>;
  /**
   * 获取数据长度
   */
  Length(): number | Promise<number>;
  /**
   * 清空数据
   */
  Empty(): void | Promise<void>;
  /**
   * 替换数据
   * @param data 数据
   */
  Replace(data: T[]): void | Promise<void>;
  /**
   * 读取首条数据
   */
  GetFirst(): (T | null) | Promise<(T | null)>;
  /**
   * 写入首条数据
   * @param data 首条数据
   */
  SetFirst(data: T): void | Promise<void>;
}

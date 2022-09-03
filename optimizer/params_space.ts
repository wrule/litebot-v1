/**
 * 参数空间配置
 */
export
interface IParamSpaceConfig {
  /**
   * 参数名
   */
  name: string;
  /**
   * 参数范围
   */
  range: [number, number];
  /**
   * 参数取值映射
   */
  get_value?: (current: number) => unknown;
}

/**
 * 参数空间
 */
export
class ParamSpace
implements Iterator<unknown> {
  public constructor(private readonly config: IParamSpaceConfig) {
    if (this.config.range[1] < this.config.range[0])
      throw 'range[1]必须大于等于range[0]';
    if (this.config.range[0] % 1 !== 0)
      throw 'range[0]必须为整数';
    if (this.config.range[1] % 1 !== 0)
      throw 'range[1]必须为整数';
    // current默认为range[0]
    this.current = this.config.range[0];
  }

  private current: number;

  public Value() {
    if (this.config.get_value)
      return this.config.get_value(this.current);
    return this.current;
  }

  public KeyValue() {
    return { [this.config.name]: this.Value(), };
  }

  /**
   * 获取参数空间内随机索引
   * @returns 随机索引
   */
  private random_current() {
    const length = this.config.range[1] - this.config.range[0] + 1;
    return this.config.range[0] + Math.floor(Math.random() * length);
  }

  /**
   * 在参数空间内随机取值
   * @returns 随机值
   */
  public RandomValue() {
    if (this.config.get_value)
      return this.config.get_value(this.random_current());
    return this.random_current();
  }

  public RandomKeyValue() {
    return { [this.config.name]: this.RandomValue(), };
  }

  /**
   * 实现迭代器
   */
  public next(): IteratorResult<unknown> {
    let result: IteratorResult<unknown>;
    if (this.current <= this.config.range[1]) {
      result = { done: false, value: this.Value(), };
      this.current++;
    } else {
      result = { done: true, value: null, };
      this.current = this.config.range[0];
    }
    return result;
  }

  [Symbol.iterator](): IterableIterator<unknown> {
    return this;
  }
}

/**
 * 多个参数组成的多维参数空间
 */
export
class ParamsSpace {
  public constructor(config: IParamSpaceConfig[]) {
    this.params_space = config.map((item) => new ParamSpace(item));
  }

  private params_space: ParamSpace[];

  /**
   * 暂时没什么用
   */
  public KeyValues() {
    let result = { };
    this.params_space.forEach((space) => {
      result = {
        ...result,
        ...space.KeyValue(),
      };
    });
    return result;
  }

  /**
   * 根据多个参数空间随机生成键值对
   * @returns 随机生成的键值对
   */
  public RandomKeyValues() {
    let result = { };
    this.params_space.forEach((space) => {
      result = {
        ...result,
        ...space.RandomKeyValue(),
      };
    });
    return result;
  }
}

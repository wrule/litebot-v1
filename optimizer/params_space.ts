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

  private random_current() {
    const length = this.config.range[1] - this.config.range[0] + 1;
    return this.config.range[0] + Math.floor(Math.random() * length);
  }

  public RandomValue() {
    if (this.config.get_value)
      return this.config.get_value(this.random_current());
    return this.random_current();
  }

  public RandomKeyValue() {
    return { [this.config.name]: this.RandomValue(), };
  }

  public next(): IteratorResult<any> {
    let result: IteratorResult<any>;
    if (this.current <= this.config.range[1]) {
      result = { done: false, value: this.Value };
      this.current++;
    } else {
      result = { done: true, value: null };
      this.current = this.config.range[0];
    }
    return result;
  }

  [Symbol.iterator](): IterableIterator<any> {
    return this;
  }
}

export
class Vector {
  public constructor(config: IVectorElementConfig[]) {
    this.elements = config.map((item) => new VectorElement(item));
  }

  private elements!: VectorElement[];

  public get RandomKeyValue() {
    let result: any = { };
    this.elements.forEach((element) => {
      result = {
        ...result,
        ...element.RandomKeyValue,
      };
    });
    return result;
  }
}

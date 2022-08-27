
export
interface IVectorElementConfig {
  name: string;
  range: [number, number];
  get_value?: (current: number) => any;
}

export
class VectorElement
implements Iterator<any> {
  public constructor(private readonly config: IVectorElementConfig) {
    if (this.config.range[1] < this.config.range[0]) {
      throw 'range[1]必须大于等于range[0]';
    }
    this.current = this.config.range[0];
  }

  private current!: number;

  public get Value() {
    if (this.config.get_value)
      return this.config.get_value(this.current);
    return this.current;
  }

  public get KeyValue() {
    return { [this.config.name]: this.Value };
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

}


export
interface IVectorElementConfig {
  range: [number, number];
  current?: number;
  get_value?: (current: number) => any;
}

export
class VectorElement {
  public constructor(_config: IVectorElementConfig) {
    if (_config.range[1] < _config.range[0]) {
      throw 'range[1]必须大于等于range[0]';
    }
    if (
      _config.current != null &&
      (_config.current < _config.range[0] || _config.current > _config.range[1])
    ) {
      throw 'current必须大于等于range[0]且小于等于range[1]';
    }
    this.config = {
      ..._config,
      current: _config.current != null ? _config.current : _config.range[0],
    };
  }

  private config!: IVectorElementConfig;

  public get Range() {
    return this.config.range;
  }

  public get Current(): number {
    return this.config.current as number;
  }

  public get Value() {
    if (this.config.get_value)
      return this.config.get_value(this.Current);
    return this.Current;
  }
}

export
class Vector {

}

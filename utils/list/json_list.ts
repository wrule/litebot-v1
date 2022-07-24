import { IList } from '.';

export
class JSONList<T>
implements IList<T> {
  public constructor() { }

  public Append(data: T) {

  }

  public All() {
    return [] as T[];
  }
}

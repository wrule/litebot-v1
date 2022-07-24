import { IList } from '.';

export
class MemoryList<T>
implements IList<T> {
  private list: T[] = [];

  public Append(data: T) {
    this.list.push(data);
  }

  public All() {
    return this.list;
  }

  public Empty() {
    this.list = [];
  }
}

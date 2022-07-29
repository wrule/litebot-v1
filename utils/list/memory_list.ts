import { IList } from '.';

export
class MemoryList<T>
implements IList<T> {
  private list: T[] = [];

  public Append(data: T) {
    this.list.push(data);
  }

  public GetFirst() {
    if (this.list.length > 0) {
      return this.list[0];
    }
    return null;
  }

  public UpdateFirst(data: T) {
    if (this.list.length > 0) {
      this.list[0] = data;
    } else {
      this.list.push(data);
    }
  }

  public All() {
    return this.list;
  }

  public Length() {
    return this.list.length;
  }

  public Empty() {
    this.list = [];
  }
}

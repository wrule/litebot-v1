import { ILogList } from '.';

export
class MemoryList<T>
implements ILogList<T> {
  private list: T[] = [];

  public Append(...data: T[]) {
    this.list.push(...data);
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

  public Replace(data: T[]) {
    this.list = data;
  }

  public GetFirst() {
    if (this.list.length < 1) return null;
    return this.list[0];
  }

  public SetFirst(data: T) {
    if (this.list.length < 1) this.list.push(data);
    this.list[0] = data;
  }
}

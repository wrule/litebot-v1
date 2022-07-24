
export
interface IList<T> {
  Append(data: T): void | Promise<void>;

  All(): T[] | Promise<T[]>;
}

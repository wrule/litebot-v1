
export
interface IList<T> {
  Append(data: T): void | Promise<void>;

  UpdateFirst(data: T): void | Promise<void>;

  All(): T[] | Promise<T[]>;

  Length(): number | Promise<number>;

  Empty(): void | Promise<void>;
}

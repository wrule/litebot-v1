
export
abstract class Watcher<T> {
  private callback_map = new Map<(data: T) => void, void>();

  public Subscribe(callback: (data: T) => void) {
    this.callback_map.set(callback);
  }

  public Unsubscribe(callback: (data: T) => void) {
    this.callback_map.delete(callback);
  }

  protected update(data: T) {
    Array.from(this.callback_map.keys())
      .forEach((callback) => {
        callback(data);
      });
  }

  public abstract Start(): void;

  public abstract Stop(): void;
}

// 2022年08月10日22:54:18

export
interface INotifier {
  SendMessage(message: string): void | Promise<void>;
}

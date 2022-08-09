import { Logger } from '../utils/logger';

export
abstract class App {
  protected logger = new Logger();

  public Run() {
    this.logger.log('应用程序开始运行');
    this.run();
  }

  protected abstract run(...args: string[]): void;
}

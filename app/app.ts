import { Logger } from '../utils/logger';

export
abstract class App {
  protected logger = new Logger();

  public Run() {
    this.logger.log('');
  }

  protected abstract run(...args: string[]): void;
}

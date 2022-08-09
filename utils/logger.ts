import moment from 'moment';

export
class Logger {
  public meta() {
    console.log(`[${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}]`);
  }

  public log(...data: any[]) {
    this.meta();
    console.log(...data);
  }

  public error(...data: any[]) {
    this.meta();
    console.error(...data);
  }

  public warn(...data: any[]) {
    this.meta();
    console.warn(...data);
  }
}

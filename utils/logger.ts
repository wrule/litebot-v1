import moment from 'moment';

export
type LogType = 'LOG' | 'ERROR' | 'WARN';

export
class Logger {
  public meta(type: LogType = 'LOG') {
    console.log(`[${
      moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }] [${
      type
    }]:`);
  }

  public log(...data: any[]) {
    this.meta('LOG');
    console.log(...data);
  }

  public error(...data: any[]) {
    this.meta('ERROR');
    console.error(...data);
  }

  public warn(...data: any[]) {
    this.meta('WARN');
    console.warn(...data);
  }
}

// 2022年08月07日22:01:43

export
interface IOHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export
type KLine = IOHLCV[];

export
interface IKLineSnapshot {
  confirmed_kline: KLine;
  last: IOHLCV;
}

export
function ArrayToOHLCV(array: number[]): IOHLCV {
  return {
    time: array[0],
    open: array[1],
    high: array[2],
    low: array[3],
    close: array[4],
    volume: array[5],
  };
}

export
function ArrayToKLine(array: number[][]): KLine {
  return array.map((item) => ArrayToOHLCV(item));
}

export
function ArrayToKLineSnapshot(array: number[][]): IKLineSnapshot {
  const kline = ArrayToKLine(array);
  if (kline.length < 1) {
    throw 'kline长度必须大于0';
  }
  return {
    confirmed_kline: kline.slice(0, kline.length - 1),
    last: kline[kline.length - 1],
  };
}

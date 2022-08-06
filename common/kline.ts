
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
interface KLineSnapshot {
  confirmed_kline: KLine;
  last: IOHLCV;
}

export
function ArrayToOHLCV(array: number[]) {
  return {
    time: array[0],
    open: array[1],
    high: array[2],
    low: array[3],
    close: array[4],
    volume: array[5],
  } as IOHLCV;
}

export
function ArrayToKLine(array: number[][]) {
  return array.map((item) => ArrayToOHLCV(item)) as KLine;
}

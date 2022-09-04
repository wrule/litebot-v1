import tulind from 'tulind';

function rsi(data: number[], size: number) {
  let rsi: number[] = [];
  tulind.indicators.rsi.indicator(
    [data],
    [size],
    (error: any, result: any) => {
      if (error) throw error;
      rsi = result[0];
    },
  );
  return rsi;
}

function main() {
  console.log('你好，世界');
  console.log(rsi([1, 2, 1, 9, 2, 3, 8, 8], 3));
  console.log(rsi([1, 2, 1, 9, 2, 3, 8, 8, 7], 3));
  console.log(rsi([1, 2, 1, 9, 2, 3, 8, 8, 7, 8], 3));
  console.log(rsi([1, 2, 1, 9, 2, 3, 8, 8, 7, 8, 6], 3));
}

main();

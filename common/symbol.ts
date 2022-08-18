
export
function SymbolSplit(symbol: string) {
  const segs = symbol.split('/').map((item) => item.trim());
  if (segs.length >= 2) {
    return [segs[0], segs[1]];
  }
  throw 'symbol解析错误';
}

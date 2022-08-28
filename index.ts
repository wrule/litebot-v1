import { Vector, VectorElement } from "./optimizer/vector";

console.log('你好，世界');

const v = new Vector([
  { name: 'fast', range: [0, 100] },
  { name: 'slow', range: [0, 100] },
  { name: 'k', range: [0, 10] },
]);

console.log(v.RandomKeyValue);

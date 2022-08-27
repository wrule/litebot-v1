import { VectorElement } from "./optimizer/vector";

console.log('你好，世界');

const ve = new VectorElement({ name: 'fast', range: [0, 10000], get_value: (current) => `${current / 100}%` });

for(let a of ve) {
  console.log(a);
}


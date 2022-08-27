import { VectorElement } from "./optimizer/vector";

console.log('你好，世界');

const ve = new VectorElement({ name: 'fast', range: [0, 100], get_value: (current) => `${current}%` });

const k = Array.from(ve);

// for(let a of ve) {
//   console.log(a);
// }
// for(let a of ve) {
//   console.log(a);
// }


import { Optimizer } from './optimizer/index';

async function main() {
  const op = new Optimizer({
    space: [
      { name: 'a', range: [-1000, 1000] },
      { name: 'b', range: [-1000, 1000] },
      { name: 'c', range: [-1000, 1000] },
    ],
    loss: (params) => (params.a * params.b) / (params.a * params.a) + 2 * (params.c * params.c)
  });
  await op.Search();
}

main();

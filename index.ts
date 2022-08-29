import { Optimizer } from './optimizer/index';

async function main() {
  const op = new Optimizer({
    space: [
      { name: 'a', range: [-1000, 1000] },
      { name: 'b', range: [-1000, 1000] },
      { name: 'c', range: [-1000, 1000] },
    ],
    objective_function: (params) => params.a + params.b + params.c,
    loss_function: (output: number) => 1 / (output * output),
  });
  await op.Search();
}

main();

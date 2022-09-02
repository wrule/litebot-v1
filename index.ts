import { Optimizer } from './optimizer';
import { Logger } from './utils/logger';

async function main() {
  const opt = new Optimizer({
    space: [
      { name: 'a', range: [-1000, 1000], },
      { name: 'b', range: [-1000, 1000], },
    ],
    objective_function: (input: any) => ({ output: (input.a * input.a) + (input.b * input.b) }),
    loss_function: (output) => 1 / output.output,
    ranking_limit: 10,
    iterations: 10000000,
    logger: new Logger(),
  });
  const ranking = await opt.Search();
  console.log(ranking);
}

main();

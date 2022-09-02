import { OptimizerRanking, Optimizer } from './optimizer';
import { Logger } from './utils/logger';

async function main() {
  console.log('你好，世界');
  const opt = new Optimizer({
    space: [
      { name: 'a', range: [-1000, 1000], },
      { name: 'b', range: [-1000, 1000], },
      { name: 'c', range: [-1000, 1000], },
    ],
    objective_function: (input: any) => ({ output: input.a * input.a + input.b * input.b }),
    loss_function: (output) => 1 / output.output,
    logger: new Logger(),
  });
  opt.Search();
}

main();

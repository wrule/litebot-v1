import { OptimizerRanking } from './optimizer';

const ranking = new OptimizerRanking({ ranking_limit: 2 });
console.log(ranking.TryAdd({ input: { }, output: 1, loss: 0.1 }));
console.log(ranking.TryAdd({ input: { }, output: 1, loss: 1 }));
console.log(ranking.TryAdd({ input: { }, output: 1, loss: 2 }));
console.log(ranking.TryAdd({ input: { }, output: 1, loss: 0.5 }));
console.log(ranking.TryAdd({ input: { }, output: 1, loss: 0.2 }));
console.log(ranking.Ranking);

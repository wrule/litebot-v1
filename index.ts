
import { OptimizerRanking } from './optimizer'

const ranking = new OptimizerRanking({ ranking_limit: 10, });
console.log(ranking.TryAdd({ input: { }, loss: 5, output: 0, }));
console.log(ranking.TryAdd({ input: { }, loss: 1, output: 0, }));
console.log(ranking.TryAdd({ input: { }, loss: 0.1, output: 0, }));
console.log(ranking.TryAdd({ input: { }, loss: 3, output: 0, }));
console.log(ranking.TryAdd({ input: { }, loss: 10, output: 0, }));
console.log(ranking.Ranking);

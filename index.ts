
import { ParamSpace, ParamsSpace } from './optimizer/params_space';

const s = new ParamsSpace([
  { name: 'fast', range: [0, 10], },
  { name: 'slow', range: [0, 20], },
  { name: 'sex', range: [0, 1], get_value: (current) => ['女', '男'][current], },
]);

console.log(s.RandomKeyValues());

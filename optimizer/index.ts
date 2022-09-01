import { IDict } from '../common/types';
import { Logger } from '../utils/logger';
import { IParamSpaceConfig, ParamsSpace } from './params_space';

/**
 * 目标函数输出结构
 */
export
interface IFunctionOutput<T> {
  output: number,
  data?: T,
}

/**
 * 目标函数输入输出结构(测试记录)
 */
export
interface IFunctionIO<T> {
  input: IDict,
  loss: number,
  output: number,
  data?: T,
}

/**
 * 优化结果排行榜
 */
export
class OptimizerRanking<T> {
  public constructor(private readonly config: { ranking_limit: number }) {
    if (this.config.ranking_limit < 1)
      throw 'ranking_limit必须大于等于1';
    this.ranking = [];
  }

  private ranking: IFunctionIO<T>[];

  public get Ranking() {
    return this.ranking;
  }

  /**
   * 尝试把结果添加入排行榜
   * @param new_item 新的结果
   * @returns 如果添加成功则返回插入索引，不成功则返回-1
   */
  public TryAdd(new_item: IFunctionIO<T>) {
    let result_index = 0;
    if (this.ranking.length < 1) {
      this.ranking.push(new_item);
      result_index = 0;
    } else {
      const last = this.ranking[this.ranking.length - 1];
      if (new_item.loss >= last.loss) {
        this.ranking.push(new_item);
        result_index = this.ranking.length - 1;
      } else {
        const index = this.ranking.findIndex((item) => item.loss > new_item.loss);
        this.ranking.splice(index, 0, new_item);
        result_index = index;
      }
      const diff = this.ranking.length - this.config.ranking_limit;
      if (diff > 0)
        this.ranking.splice(this.config.ranking_limit, diff);
      if (result_index > this.config.ranking_limit - 1)
        result_index = -1;
    }
    return result_index;
  }
}

/**
 * 优化器配置
 */
export
interface IOptimizerConfig<T> {
  /**
   * 超参数空间
   */
  space: IParamSpaceConfig[],
  /**
   * 目标函数
   */
  objective_function: (input: IDict) => IFunctionOutput<T> | Promise<IFunctionOutput<T>>;
  /**
   * 损失函数(为空不额外处理)
   */
  loss_function?: (output: IFunctionOutput<T>) => number;
  /**
   * 入参过滤器(为空不过滤)
   */
  input_filter?: (input: IDict) => boolean;
  /**
   * 出参过滤器(为空不过滤)
   */
  output_filter?: (output: IFunctionOutput<T>) => boolean;
  /**
   * 损失过滤器(为空不过滤)
   */
  loss_filter?: (loss: number) => boolean;
  /**
   * 排行榜长度限制(为空默认10000)
   */
  ranking_limit?: number;
  /**
   * 迭代次数(为空默认持续迭代)
   */
  iterations?: number;
}

export
class Optimizer<T> {
  public constructor(private readonly config: IOptimizerConfig<T>) {
    if (this.config.space.length < 1)
      throw 'space维度必须大于等于1';
    if (this.config.ranking_limit != null && this.config.ranking_limit < 1)
      throw 'ranking_limit必须大于等于1或为空(默认10000)';
    if (this.config.iterations != null && this.config.iterations < 1)
      throw 'iterations必须大于等于1或为空(持续迭代)';
    this.space = new ParamsSpace(this.config.space);
    this.ranking = new OptimizerRanking({ ranking_limit: this.config.ranking_limit || 10000 });
  }

  private space: ParamsSpace;
  private ranking: OptimizerRanking<T>;

  private get loss_function() {
    const pass = (output: IFunctionOutput<T>) => output.output;
    return this.config.loss_function || pass;
  }

  private get input_filter() {
    const pass = (input: IDict) => true;
    return this.config.input_filter || pass;
  }

  private get output_filter() {
    const pass = (output: IFunctionOutput<T>) => true;
    return this.config.output_filter || pass;
  }

  private get loss_filter() {
    const pass = (loss: number) => true;
    return this.config.loss_filter || pass;
  }

  private get ranking_limit() {
    return this.config.ranking_limit || 10000;
  }

  private get iterations() {
    return this.config.iterations || Infinity;
  }

  public async Search() {
    for (let i = 0; i < this.iterations; ++i) {
      const input = this.space.RandomKeyValues();
      if (!this.input_filter(input))
        continue;
      const output = await this.config.objective_function(input);
      if (!this.output_filter(output))
        continue;
      const loss = this.loss_function(output);
      if (!this.loss_filter(loss))
        continue;
    }
  }
}

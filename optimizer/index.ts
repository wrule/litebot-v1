import { IDict } from '../common/types';
import { Logger } from '../utils/logger';
import { IParamSpaceConfig, ParamsSpace } from './params_space';

/**
 * 优化器输入输出结构(优化结果)
 */
export
interface IOptimizerIO<T> {
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

  private ranking: IOptimizerIO<T>[];

  public TryAdd(new_item: IOptimizerIO<T>) {
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
 * 排行项目
 */
export
interface IRankingItem {
  input: any;
  output: number;
  loss: number;
}

/**
 * 优化器配置
 */
export
interface IOptimizerConfig {
  /**
   * 超参数空间
   */
  space: IVectorElementConfig[],
  /**
   * 目标函数
   */
  objective_function: (params: any) => number | Promise<number>;
  /**
   * 损失函数(为空不额外处理)
   */
  loss_function?: (output: number) => number;
  /**
   * 入参过滤器(为空不过滤)
   */
  input_filter?: (input: any) => boolean;
  /**
   * 出参过滤器(为空不过滤)
   */
  output_filter?: (output: number) => boolean;
  /**
   * 损失过滤器(为空不过滤)
   */
  loss_filter?: (loss: number) => boolean;
  /**
   * 排行长度限制(为空默认10000)
   */
  ranking_limit?: number;
  /**
   * 迭代次数(为空默认持续迭代)
   */
  iterations?: number;
}

export
class Optimizer {
  public constructor(private readonly config: IOptimizerConfig) {
    if (this.config.space.length < 1)
      throw 'space维度必须大于等于1';
    if (this.config.ranking_limit != null && this.config.ranking_limit < 1)
      throw 'ranking_limit必须大于等于1或为空(默认10000)';
    if (this.config.iterations != null && this.config.iterations < 1)
      throw 'iterations必须大于等于1或为空(持续迭代)';
    this.vector = new Vector(this.config.space);
    this.ranking = [];
  }

  private vector: Vector;
  private ranking: IRankingItem[];

  private get loss_function() {
    const pass = (output: number) => output;
    return this.config.loss_function || pass;
  }

  private get input_filter() {
    const pass = (input: any) => true;
    return this.config.input_filter || pass;
  }

  private get output_filter() {
    const pass = (output: number) => true;
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

  private logger = new Logger();

  private logOptimal() {
    this.logger.log(this.ranking[0]);
  }

  public async Search() {
    for (let i = 0; i < this.iterations; ++i) {
      const input = this.vector.RandomKeyValue;
      if (!this.input_filter(input))
        continue;
      const output = await this.config.objective_function(input);
      if (!this.output_filter(output))
        continue;
      const loss = this.loss_function(output);
      if (!this.loss_filter(loss))
        continue;

      if (this.ranking.length <= 0) {
        this.ranking.push({ input, output, loss });
        this.logOptimal();
      } else {
        const last = this.ranking[this.ranking.length - 1];
        if (loss >= last.loss) {
          this.ranking.push({ input, output, loss });
        } else {
          const index = this.ranking.findIndex((item) => item.loss > loss);
          this.ranking.splice(index, 0, { input, output, loss });
          if (index === 0) {
            this.logOptimal();
          }
        }
        const diff = this.ranking.length - this.ranking_limit;
        if (diff > 0) {
          this.ranking.splice(this.ranking_limit, diff);
        }
      }
    }
  }
}

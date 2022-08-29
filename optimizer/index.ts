import { Logger } from '../utils/logger';
import { IVectorElementConfig, Vector } from './vector';

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
  objective_function: (params: any) => number;
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
    if (this.config.space.length < 1) {
      throw 'space维度必须大于等于1';
    }
    if (
      this.config.ranking_limit != null &&
      this.config.ranking_limit < 1
    ) {
      throw 'ranking_limit必须大于等于1或为空(默认10000)';
    }
    if (this.config.iterations != null && this.config.iterations < 1) {
      throw 'iterations必须大于等于1或为空(持续迭代)';
    }
    this.vector = new Vector(this.config.space);
    this.input_output_ranking = [];
  }

  private vector: Vector;
  private input_output_ranking: { input: any, output: number }[];

  private get loss_function() {
    const pass = (num: number) => num;
    return this.config.loss_function || pass;
  }

  private get input_filter() {
    const pass = (input: any) => true;
    return this.config.input_filter || pass;
  }

  private get output_filter() {
    const pass = (output: any) => true;
    return this.config.output_filter || pass;
  }

  private get loss_filter() {
    const pass = (loss: any) => true;
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
    this.logger.log(this.input_output_ranking[0]);
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

      if (this.input_output_ranking.length <= 0) {
        this.input_output_ranking.push({ input, output });
        this.logOptimal();
      } else {
        const last = this.input_output_ranking[this.input_output_ranking.length - 1];
        if (output >= last.output) {
          this.input_output_ranking.push({ input, output });
        } else {
          const index = this.input_output_ranking.findIndex((item) => item.output > output);
          this.input_output_ranking.splice(index, 0, { input, output });
          if (index === 0) {
            this.logOptimal();
          }
        }

        const diff = this.input_output_ranking.length - this.ranking_limit;
        if (diff > 0) {
          this.input_output_ranking.splice(this.ranking_limit, diff);
        }
      }
    }
  }
}

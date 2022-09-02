import { Logger } from '../utils/logger';
import { IDict } from '../common/types';
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
 * 测试记录(目标函数输入输出结构)
 */
export
interface ITestRecord<T> {
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
  public constructor(config: { ranking_limit?: number }) {
    if (config.ranking_limit != null && config.ranking_limit < 1)
      throw 'ranking_limit必须大于等于1或为空(默认10000)';
    this.ranking_limit = config.ranking_limit || 10000;
    this.ranking = [];
  }

  private readonly ranking_limit: number;
  private readonly ranking: ITestRecord<T>[];

  /**
   * 排行榜数据
   */
  public get Ranking() {
    return this.ranking;
  }

  /**
   * 尝试把测试记录添加入排行榜
   * @param test_record 新的测试记录
   * @returns 如果添加成功则返回插入索引，不成功则返回-1
   */
  public TryAdd(test_record: ITestRecord<T>) {
    let result_index = -1;
    if (this.ranking.length < 1) {
      this.ranking.push(test_record);
      result_index = 0;
    } else {
      const last = this.ranking[this.ranking.length - 1];
      if (test_record.loss >= last.loss) {
        this.ranking.push(test_record);
        result_index = this.ranking.length - 1;
      } else {
        const index = this.ranking.findIndex((item) => item.loss > test_record.loss);
        this.ranking.splice(index, 0, test_record);
        result_index = index;
      }
      const diff = this.ranking.length - this.ranking_limit;
      if (diff > 0)
        this.ranking.splice(this.ranking_limit, diff);
      if (result_index > this.ranking_limit - 1)
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
   * 入参映射器(为空不处理)
   */
  input_mapper?: (input: IDict) => IDict;
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
   * 排行榜长度限制
   */
  ranking_limit?: number;
  /**
   * 迭代次数(为空默认持续迭代)
   */
  iterations?: number;
  /**
   * 优化日志记录器
   */
  logger?: Logger;
}

/**
 * 优化器
 */
export
class Optimizer<T> {
  public constructor(private readonly config: IOptimizerConfig<T>) {
    if (this.config.space.length < 1)
      throw 'space维度必须大于等于1';
    if (this.config.iterations != null && this.config.iterations < 1)
      throw 'iterations必须大于等于1或为空(持续迭代)';
    this.space = new ParamsSpace(this.config.space);
    this.ranking = new OptimizerRanking(this.config);
  }

  private space: ParamsSpace;
  private ranking: OptimizerRanking<T>;

  private get loss_function() {
    const pass = (output: IFunctionOutput<T>) => output.output;
    return this.config.loss_function || pass;
  }

  private get input_mapper() {
    const pass = (input: IDict) => input;
    return this.config.input_mapper || pass;
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

  private get iterations() {
    return this.config.iterations || Infinity;
  }

  /**
   * 搜索参数空间
   */
  public async Search() {
    for (let i = 0; i < this.iterations; ++i) {
      // 生成随机输入参数
      const input = this.input_mapper(this.space.RandomKeyValues());
      // 过滤器判断与目标函数计算
      if (!this.input_filter(input)) continue;
      let output: IFunctionOutput<T> = null as any;
      try {
        output = await this.config.objective_function(input);
      } catch (e) {
        this.config.logger?.error(e);
        continue;
      }
      if (!this.output_filter(output)) continue;
      const loss = this.loss_function(output);
      if (!this.loss_filter(loss)) continue;
      // 构造测试记录并尝试加入排行榜
      const test_record: ITestRecord<T> = { input, loss, ...output, };
      const index = this.ranking.TryAdd(test_record);
      // 如果最优记录变化，则输出日志
      if (index < 1) this.config.logger?.log(test_record);
    }
  }
}

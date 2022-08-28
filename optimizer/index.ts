import { IVectorElementConfig, Vector } from "./vector";

export
interface IOptimizerConfig {
  space: IVectorElementConfig[],
  loss: (params: any) => number;
  input_filter?: (input: any) => boolean;
  output_filter?: (output: number) => boolean;
  input_output_ranking_limit?: number;
  iterations?: number;
}

export
abstract class Optimizer {
  public constructor(private readonly config: IOptimizerConfig) {
    if (this.config.space.length < 1) {
      throw 'space维度必须大于等于1';
    }
    if (
      this.config.input_output_ranking_limit != null &&
      this.config.input_output_ranking_limit < 1
    ) {
      throw 'input_output_ranking_limit必须大于等于1或为空(默认10000)';
    }
    if (this.config.iterations != null && this.config.iterations < 1) {
      throw 'iterations必须大于等于1或为空(持续迭代)';
    }
    this.vector = new Vector(this.config.space);
    this.input_output_ranking = [];
  }

  private vector: Vector;
  private input_output_ranking: { input: any, output: number }[];

  private get input_output_ranking_limit() {
    return this.config.input_output_ranking_limit || 10000;
  }

  public async Search() {
    for (
      let i = 0;
      this.config.iterations == null || i < this.config.iterations;
      ++i
    ) {
      const input = this.vector.RandomKeyValue;
      if (this.config.input_filter && !this.config.input_filter(input))
        continue;
      const output = await this.config.loss(input);
      if (this.config.output_filter && !this.config.output_filter(output))
        continue;

      if (this.input_output_ranking.length <= 0)
        this.input_output_ranking.push({ input, output });

      const last = this.input_output_ranking[this.input_output_ranking.length - 1];
      if (output >= last.output) {
        this.input_output_ranking.push({ input, output });
      } else {
        const index = this.input_output_ranking.findIndex((item) => item.output > output);
        this.input_output_ranking.splice(index, 0, { input, output });
      }
    }
  }
}

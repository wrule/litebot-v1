import { IList } from '.';
import fs from 'fs';

export
class JSONList<T>
implements IList<T> {
  public constructor(
    private readonly file: string,
  ) { }

  public Append(data: T) {
    fs.appendFileSync(this.file, JSON.stringify(data) + ',\n', 'utf-8');
  }

  public All() {
    let json_text = fs.readFileSync(this.file, 'utf-8');
    json_text = `[${json_text.substring(0, json_text.length - 2)}]`;
    return JSON.parse(json_text) as T[];
  }

  public Empty() {
    fs.writeFileSync(this.file, '', 'utf-8');
  }
}

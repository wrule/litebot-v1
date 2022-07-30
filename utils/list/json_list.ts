import { IList } from '.';
import fs from 'fs';

export
class JSONList<T>
implements IList<T> {
  public constructor(
    private readonly file: string,
  ) { }

  public Append(...data: T[]) {
    data.forEach((item) => {
      fs.appendFileSync(this.file, JSON.stringify(item) + ',\n', 'utf-8');
    });
  }

  public GetFirst() {
    const list = this.All();
    if (list.length > 0) {
      return list[0];
    }
    return null;
  }

  public SetFirst(data: T) {
    const list = this.All();
    if (list.length > 0) {
      list[0] = data;
    } else {
      list.push(data);
    }
    this.Empty();
    this.Append(...list);
  }

  public All() {
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, '', 'utf-8');
    }
    let json_text = fs.readFileSync(this.file, 'utf-8');
    json_text = `[${json_text.substring(0, json_text.length - 2)}]`;
    return JSON.parse(json_text) as T[];
  }

  public Length() {
    return this.All().length;
  }

  public Empty() {
    fs.writeFileSync(this.file, '', 'utf-8');
  }
}

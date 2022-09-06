import fs from 'fs';
import fsPromise from 'fs/promises';
import { ILogList } from '.';

export
class JSONFileList<T>
implements ILogList<T> {
  public constructor(private readonly file_path: fs.PathLike) { }

  public async Append(...data: T[]) {
    for (let i = 0; i < data.length; ++i) {
      await fsPromise.appendFile(this.file_path, JSON.stringify(data[i], null, 2) + ',\n', 'utf-8');
    }
  }

  public async All() {
    // if (!fsPromise. (this.file_path)) {
    //   fs.writeFileSync(this.file, '', 'utf-8');
    // }
    let json_text = await fsPromise.readFile(this.file_path, 'utf-8');
    json_text = `[${json_text.substring(0, json_text.length - 2)}]`;
    return JSON.parse(json_text) as T[];
  }

  public async Length() {
    return (await this.All()).length;
  }

  public async Empty() {
    await fsPromise.writeFile(this.file_path, '', 'utf-8');
  }

  public async GetFirst() {
    const list = await this.All();
    if (list.length < 1) return null;
    return list[0];
  }

  public async SetFirst(data: T) {
    const list = await this.All();
    if (list.length < 1) list.push(data);
    else list[0] = data;
    await this.Empty();
    await this.Append(...list);
  }
}

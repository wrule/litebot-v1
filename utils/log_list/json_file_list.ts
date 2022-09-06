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
}

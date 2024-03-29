import fs from 'fs';

export
function write_list<T>(file: string, list: T[]) {
  fs.writeFileSync(file, '', 'utf-8');
  list.forEach((item) => {
    append_list(file, item);
  });
}

export
function read_list<T>(file: string): T[] {
  let json_text = fs.readFileSync(file, 'utf-8');
  json_text = `[${json_text.substring(0, json_text.length - 2)}]`;
  return JSON.parse(json_text);
}

export
function append_list<T>(file: string, item: T) {
  fs.appendFileSync(file, JSON.stringify(item) + ',\n', 'utf-8');
}

export
function delete_list<T>(
  file: string,
  filter: (item: T) => boolean,
) {
  write_list<T>(
    file,
    read_list<T>(file)
      .filter((item) => !filter(item)),
  );
}

export
function update_list<T>(
  file: string,
  filter: (item: T) => boolean,
  ...items: T[]
) {
  const replace_items = items.slice(0);
  const list = read_list<T>(file);
  while (true) {
    const index = list.findIndex((item) => filter(item));
    const replace_item = replace_items.pop();
    if (index > -1 && replace_item) {
      list.splice(index, 1, replace_item);
    } else {
      break;
    }
  }
  write_list<T>(file, list);
}

export
function query_list<T>(
  file: string,
  filter: (item: T) => boolean,
) {
  return read_list<T>(file).filter((item) => filter(item));
}

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
  fs.appendFileSync(file, JSON.stringify(item, null, 2) + ',\n', 'utf-8');
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

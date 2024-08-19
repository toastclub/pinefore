import { readdirSync, readFileSync } from "node:fs";
import parse from "!server/helpers/snarkdown";

export function templates() {
  let target = import.meta.dirname + "/templates";
  const dir = readdirSync(target, {
    recursive: true,
  }).filter((file) => file.toString().endsWith(".md"));
  return JSON.stringify(
    Object.fromEntries(
      dir.map((file) => {
        let contents = readFileSync(target + "/" + file, "utf-8").split("\n");
        let title = contents.shift();
        contents.shift();
        return [
          file.toString().replace(".md", ""),
          {
            title,
            contents: parse(contents.join("\n")),
          },
        ];
      })
    )
  );
}

export function layout() {
  return (
    readFileSync(import.meta.dirname + "/wrapper.html", "utf-8")
      // 30% cost reduction lol (like 5 cents a month max)
      .replace(/(<!--[^]+?->|\s)+/g, " ")
      .replace(/ (?=<|$)|<\/[tl].>|<.p> *(<[p/])| ?\/?(>)/gi, "$1$2")
  );
}

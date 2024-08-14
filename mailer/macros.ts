import { readdirSync, readFileSync } from "node:fs";
import parse from "!server/helpers/snarkdown";

export function templates(): {
  [key: string]: {
    title: string;
    contents: string;
  };
} {
  let target = import.meta.dirname + "/templates";
  const dir = readdirSync(target, {
    recursive: true,
  }).filter((file) => file.toString().endsWith(".md"));
  return Object.fromEntries(
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
  );
}

export function layout() {
  return readFileSync(import.meta.dirname + "/wrapper.html", "utf-8");
}

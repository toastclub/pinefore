import { readdirSync, readFileSync } from "node:fs";

export function templates() {
  let target = import.meta.dirname + "/templates";
  const dir = readdirSync(target, {
    recursive: true,
  }).filter((file) => file.toString().endsWith(".md"));
  return Object.fromEntries(
    dir.map((file) => [file, readFileSync(target + "/" + file, "utf-8")])
  );
}

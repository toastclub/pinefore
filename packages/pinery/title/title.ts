import { BrowserResponse, ColumnSchema } from "../types";

export function toTitleRecord<T extends ColumnSchema>(
  schema: T,
  data: BrowserResponse<T>
) {
  let title: Record<string, string[]> = {};

  for (const [k, v] of Object.entries(data)) {
    if (!v) continue;
    if (!title[k]) title[k] = [];

    const type = schema[k].type;
    const formatRange = (start: string, end: string, inclusive = false) =>
      `${k} between ${
        typeof start == "number" ? start : start.toLocaleDateString()
      } and ${typeof end == "number" ? end : end.toLocaleDateString()}`;
    const formatComparison = (op: string, value: any) =>
      `${k} ${op} ${
        typeof value == "number" ? value : value.toLocaleDateString()
      }`;

    if (type === "date" || type === "number") {
      if (v[">"] && v["<"]) title[k].push(formatRange(v[">"], v["<"]));
      else if (v[">="] && v["<="])
        title[k].push(formatRange(v[">="], v["<="], true));
      else if (v["=="] || v["="])
        title[k].push(formatComparison("is", v["=="] || v["="]));
      else {
        if (v[">"] || v[">="])
          title[k].push(formatComparison("after", v[">"] || v[">="]));
        if (v["<"] || v["<="])
          title[k].push(formatComparison("before", v["<"] || v["<="]));
        if (v[">"]) title[k].push(formatComparison("greater than", v[">"]));
        if (v["<"]) title[k].push(formatComparison("less than", v["<"]));
      }
    } else if (type === "bool") {
      title[k].push(k);
    } else if (type === "string") {
      const strOps = {
        "=": "with the",
        "==": "with the",
        "!=": "is not",
        "^=": "starts with",
        "$=": "ends with",
      };
      for (const [key, value] of Object.entries(v)) {
        if (value) title[k].push(`${strOps[key]} ${k} '${value}'`);
      }
    } else if (type === "array") {
      if (v["="])
        title[k].push(
          `with the ${k.endsWith("s") ? k : k + "s"} ${v["="].join(", ")}`
        );
    }
  }

  return title;
}

export function toTitleString<T extends ColumnSchema>(
  schema: T,
  order: (string | { type: keyof T; dontIncludeK?: boolean })[],
  data: BrowserResponse<T>
) {
  let title = toTitleRecord(schema, data);
  let string = [];
  for (let i = 0; i < order.length; i++) {
    let k = order[i];
    if (typeof k == "string") {
      string.push(order[i] + " ");
      continue;
    }
    if (title == undefined) return string.join("");
    let _l = title[k.type as any];
    for (let l of _l) {
      if (l.startsWith(k.type as any) && k.dontIncludeK) {
        l = l.substring(k.type.length + 1);
      }
      string.push(l);
      if (i < order.length - 1) {
        string.push(", ");
      }
    }
  }
  for (let i = 0; i < string.length; i++) {
    if (
      string[i].startsWith("with the") &&
      string[i - 2] &&
      (string[i - 2].startsWith("the") || string[i - 2].startsWith("with the"))
    ) {
      string[i] = string[i].replace(/^(with )?the/, "the");
    }
    if (string[i] == ", " && string[i + 1] == undefined) {
      string[i] = "";
    } else if (
      string[i] == ", " &&
      string[i + 2] == undefined &&
      string.reduce((acc, curr) => {
        return acc + (curr == ", " ? 1 : 0);
      }, 0) > 0
    ) {
      string[i] = " and ";
    }
  }
  return string.join("");
}

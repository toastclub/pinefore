/**
 * @fileoverview Lightweight encoding and decoding for *good enough* functionality.
 */

import { allowedOperators, possiblyOperator } from "../decode";
import { BrowserResponse, ColumnSchema } from "../types";
const joiners = ["!", "+", "|"] as const;

export function decode<T extends ColumnSchema>(
  data: string,
  schema: T
): BrowserResponse<T> {
  let isInString = false;
  let nestingLevel = 0;
  let workingTree: { concluded: boolean; data: string }[] = [];
  for (let i = 0; i < data.length; i++) {
    let last = workingTree[workingTree.length - 1];
    if (isInString) {
      if (data[i] === "'") {
        isInString = false;
        if (nestingLevel === 0) {
          last.concluded = true;
        } else {
          last.data += data[i];
        }
      }
      last.data += data[i];
      continue;
    }
    if (data[i] === "'") {
      isInString = true;
    }
    if (data[i] === "(") {
      nestingLevel++;
      continue;
    }
    if (data[i] === ")") {
      nestingLevel--;
      continue;
    }
    if (nestingLevel > 0) {
      continue;
    }
    if (
      joiners.includes(data[i] as any) &&
      !(data[i] == "!" && data[i + 1] == "=") &&
      nestingLevel === 0
    ) {
      if (last) {
        last.concluded = true;
      }
      continue;
    }
    if (workingTree.length == 0 || last.concluded) {
      workingTree.push({ data: "", concluded: false });
      last = workingTree[workingTree.length - 1];
    }
    last.data += data[i];
  }
  let res: BrowserResponse<T> = {} as BrowserResponse<T>;
  Object.keys(schema).forEach((key) => {
    if (schema[key].type == "bool") res[key] = null;
    else
      res[key] = Object.fromEntries(
        allowedOperators[schema[key].type].map((op) => [op, null])
      );
  });
  for (let i = 0; i < workingTree.length; i++) {
    let cur = workingTree[i];
    let colName = Object.keys(schema).find((col) =>
      (cur.data as string).startsWith(col)
    );
    if (!colName) {
      continue;
    }
    let col = schema[colName];
    let operator = possiblyOperator((cur.data as string).slice(colName.length));
    let remaining = cur.data.slice(colName.length + (operator?.length || 0));
    if (col.type == "bool") res[col.mapsTo] = col.true;
    else if (col.type == "number") res[colName][operator] = Number(remaining);
    else if (col.type == "date")
      // @ts-expect-error
      res[colName][operator] = new Date(remaining);
    else if (col.type == "array")
      // @ts-expect-error
      res[colName][operator] = remaining.split(",").map((r) => r.trim());
    // @ts-expect-error
    else res[colName][operator] = remaining;
  }
  return res;
}

export function encode<T extends ColumnSchema>(
  data: BrowserResponse<ColumnSchema>,
  schema: T
) {
  let res = [];
  for (let [key, value] of Object.entries(data)) {
    if (typeof value == "boolean") {
      let schemaKey = Object.keys(schema).find(
        (k) =>
          schema[k].mapsTo == key &&
          // @ts-expect-error
          schema[k].true == value
      );
      if (schemaKey) res.push(schemaKey);
    } else if (value == null) {
      continue;
    } else {
      for (let [operator, v2] of Object.entries(value)) {
        if (v2 == null || (typeof v2 == "string" && v2.length == 0)) continue;
        else if (typeof v2.getMonth === "function")
          res.push(`${key}${operator}${v2.toISOString().substring(0, 10)}`);
        else if (Array.isArray(v2))
          res.push(`${key}${operator}${v2.join(",")}`);
        else res.push(`${key}${operator}${v2}`);
      }
    }
  }
  return res.join("+");
}

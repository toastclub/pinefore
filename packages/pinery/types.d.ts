import { allowedOperators, operators } from "./decode";

export interface Operation<
  T extends string | number | boolean | Date | string[]
> {
  column: string;
  operator: (typeof operators)[number];
  value: T;
}

export type Operations = (Operation<any> | Combiner)[];

export interface Combiner {
  mode: "AND" | "OR" | "NOT";
  /**
   * If mode is "NOT", operations should have only one element
   */
  operations: Operations;
}

export type AST = ((
  | {
      type: "str" | "expr" | "oper";
      data: string;
    }
  | {
      type: "parn";
      data: AST | string;
    }
) & {
  concluded: boolean;
})[];

export type ColumnType = "string" | "number" | "date" | "array";

export type ColumnSchema = {
  [column: string]:
    | {
        type: ColumnType;
        mapsTo: string;
      }
    | {
        type: "bool";
        mapsTo: string;
        true: boolean;
      };
};

type OpString = (typeof operators)[number];

type BrowserSubType<S extends ColumnType, T> = {
  [K in (typeof allowedOperators)[S][number]]: T | null;
};
type GetBrowserType<T extends ColumnType | "bool"> = {
  string: BrowserSubType<"string", string>;
  number: BrowserSubType<"number", number>;
  date: BrowserSubType<"date", Date>;
  array: BrowserSubType<"array", string[]>;
  bool: boolean;
}[T];

export type BrowserResponse<T extends ColumnSchema> = {
  [K in keyof T]: GetBrowserType<T[K]["type"]>;
};

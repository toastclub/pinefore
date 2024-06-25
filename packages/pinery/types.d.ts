import { operators } from "./decode";

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

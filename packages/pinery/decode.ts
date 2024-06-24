const operators = [
  "!=",
  "==",
  "=",
  ">",
  "<",
  ">=",
  "<=",
  "^=",
  "$=",
  "<@",
] as const;

const possiblyOperator = (str: string) =>
  operators.find((op) => str.startsWith(op));

interface Operation<T extends string | number | boolean | Date | string[]> {
  column: string;
  operator: (typeof operators)[number];
  value: T;
}

interface Combiner {
  mode: "AND" | "OR" | "NOT";
  /**
   * If mode is "NOT", operations should have only one element
   */
  operations: (Operation<any> | Combiner)[];
}

const joiners = ["!", "+", "|"] as const;

type AST = ((
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

/**
 *
 * @param data String must not be URL encoded
 *
 */
export function decodeToAST(
  data: string,
  internalData?: {
    nestingLevel: number;
  }
): AST {
  let isInString = false;
  let nestingLevel = internalData?.nestingLevel ?? 0;
  let workingTree: AST = [];
  for (let i = 0; i < data.length; i++) {
    // if we are in a string, we are only looking for the end of the string
    // some code exists to shortcut parenthesis analysis if we are in a string
    if (isInString) {
      // if we have a terminating quote
      if (data[i] === "'") {
        isInString = false;
        // if we are not inside a parenthesis, we should be in a string span
        // that we can conclude. If we are inside a parenthesis, we should include
        // the terminating quote in the span.
        if (nestingLevel === 0) {
          workingTree[workingTree.length - 1].concluded = true;
        } else {
          workingTree[workingTree.length - 1].data += data[i];
        }
        continue;
      }
      // otherwise, keep pushing data
      workingTree[workingTree.length - 1].data += data[i];
      continue;
    }
    // if we *aren't* in a string, and a string is beginning
    if (data[i] === "'") {
      isInString = true;
      // only create a new span if we are not inside a parenthesis
      if (nestingLevel === 0) {
        workingTree.push({ type: "str", data: "", concluded: false });
        continue;
      }
    }
    // if we are starting a parenthesis, we need to count how nested we are, as
    // we are only interested in the outermost parenthesis (rest will be evaluated recursively)
    // yes, recursion is bad
    if (data[i] === "(") {
      nestingLevel++;
      if (nestingLevel === 4) {
        throw new Error("Nesting level too deep");
      }
      // if we are just beginning an outtermost paran
      if (nestingLevel === 1) {
        workingTree.push({ type: "parn", data: "", concluded: false });
        continue;
      }
    }
    if (data[i] === ")") {
      nestingLevel--;
      if (nestingLevel < 0) {
        throw new Error("Unmatched parenthesis");
      }
      // if concluding, evaludate inner
      if (nestingLevel === 0) {
        workingTree[workingTree.length - 1].concluded = true;
        workingTree[workingTree.length - 1].data = decodeToAST(
          workingTree[workingTree.length - 1].data as string
        );
      } else {
        // push parenthesis data to the current span
        workingTree[workingTree.length - 1].data += data[i];
      }
      continue;
    }
    // if it is a joiner
    if (
      joiners.includes(data[i] as any) &&
      !(data[i] == "!" && data[i + 1] == "=") &&
      nestingLevel === 0
    ) {
      workingTree[workingTree.length - 1].concluded = true;
      workingTree.push({ type: "oper", data: data[i], concluded: true });
      continue;
    }
    // if we are starting an expression
    if (
      workingTree.length == 0 ||
      workingTree[workingTree.length - 1].concluded
    ) {
      workingTree.push({ type: "expr", data: "", concluded: false });
    }
    workingTree[workingTree.length - 1].data += data[i];
  }
  return workingTree;
}

type ColumnType = "string" | "number" | "date" | "array";

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

const allowedOperators: Record<ColumnType, (typeof operators)[number][]> = {
  string: ["=", "!=", "==", "^=", "$="],
  number: ["=", "!=", ">", "<", ">=", "<="],
  date: ["=", "!=", ">", "<", ">=", "<="],
  array: ["="],
};

export function integrityCheck(ast: AST, columns: ColumnSchema) {
  let columnNames = Object.keys(columns);
  if (ast[ast.length - 1].type == "str" && !ast[ast.length - 1].concluded) {
    throw new Error("Strings must be concluded");
  }
  let hasEncounteredAnd = false;
  let finalSt: Combiner = {
    mode: "AND",
    operations: [],
  };
  for (let i = 0; i < ast.length; i++) {
    let cur = ast[i];
    // basic checks
    if (cur.type == "parn") {
      let check = integrityCheck(ast[i].data as AST, columns);
      if (ast[i - 1]?.data == "!") {
        finalSt.operations.push({
          mode: "NOT",
          operations: [check],
        });
      } else {
        finalSt.operations.push(check);
      }
      continue;
    }
    if (cur.type == "str") {
      if (ast[i - 1].type != "expr") {
        throw new Error("Strings must be preceded by expressions");
      }
    }
    if (cur.type == "oper") {
      if (cur.data == "!") {
        if (ast[i + 1].type != "parn") {
          throw new Error("NOT must preceed a parenthesis");
        }
      }
      if (
        !(ast[i - 1].type == "expr" || ast[i - 1].type == "parn") ||
        !(ast[i + 1].type == "expr" || ast[i + 1].type == "parn")
      ) {
        throw new Error("Joiners must join expressions or parenthesis");
      }
      if (cur.data == "|") {
        if (hasEncounteredAnd) {
          throw new Error("OR cannot be used with AND");
        }
        finalSt.mode = "OR";
      }
      if (cur.data == "+") {
        if (finalSt.mode == "OR") {
          throw new Error("OR cannot be used with AND");
        }
      }
    }
    // expr validator
    if (cur.type == "expr") {
      let colName = columnNames.find((col) =>
        (cur.data as string).startsWith(col)
      );
      if (!colName) {
        throw new Error("Column not found");
      }
      let col = columns[colName];
      let operator = possiblyOperator(
        (cur.data as string).slice(colName.length)
      );
      if (col.type == "bool" && operator != undefined) {
        throw new Error("Boolean columns cannot have operators");
      }
      if (col.type != "string" && ast[i + 1]?.type == "str") {
        throw new Error("Non-string columns cannot have strings");
      }
      if (col.type == "bool") {
        if (!columnNames.find((col) => col == cur.data)) {
          throw new Error("Column not found");
        }
        finalSt.operations.push({
          column: col.mapsTo,
          operator: "=",
          value: col.true,
        });
        continue;
      }
      if (!operator) {
        throw new Error("Operator not found");
      }
      if (!allowedOperators[col.type].includes(operator)) {
        throw new Error("Operator not allowed for column type");
      }
      let afterOperator = (ast[i].data as string).slice(
        colName.length + operator.length
      );
      if (col.type == "number") {
        if (isNaN(Number(afterOperator))) {
          throw new Error("Invalid number");
        }
        finalSt.operations.push({
          column: col.mapsTo,
          operator: operator,
          value: Number(afterOperator),
        });
      }
      if (col.type == "date") {
        if (isNaN(Date.parse(afterOperator))) {
          throw new Error("Invalid date");
        }
        finalSt.operations.push({
          column: col.mapsTo,
          operator: operator,
          value: new Date(afterOperator),
        });
      }
      // otherwise it is a string or array
      if (ast[i + 1]?.type == "str") {
        if (afterOperator.length != 0) {
          throw new Error("String must be fully quoted or fully unquoted");
        }
        afterOperator = ast[i + 1].data as string;
      }
      if (col.type == "string") {
        finalSt.operations.push({
          column: col.mapsTo,
          operator: operator,
          value: afterOperator,
        });
      }
      if (col.type == "array") {
        finalSt.operations.push({
          column: col.mapsTo,
          operator: operator,
          value: afterOperator.split(","),
        });
      }
    }
  }
  return finalSt;
}

export function decode(data: string, columns: ColumnSchema) {
  data = decodeURIComponent(data);
  let ast = decodeToAST(data);
  return integrityCheck(ast, columns);
}

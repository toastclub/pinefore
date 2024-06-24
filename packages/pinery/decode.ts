type Operator =
  | "="
  | "!="
  | "=="
  | ">"
  | "<"
  | ">="
  | "<="
  | "^="
  | "$="
  // is contained by
  | "<@";

interface Operation<T extends string | number | boolean | Date | string[]> {
  column: string;
  operator: Operator;
  value: T;
}

interface Combiner {
  mode: "AND" | "OR" | "NOT";
  /**
   * If mode is "NOT", operations should have only one element
   */
  operations: (Operation<any> | Combiner)[];
}

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
  data = decodeURIComponent(data);
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
    // if we are starting an expression
    if (workingTree[workingTree.length - 1].concluded) {
      workingTree.push({ type: "expr", data: "", concluded: false });
    }
    workingTree[workingTree.length - 1].data += data[i];
  }
  return workingTree;
}
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

/**
 *
 * @param data String must not be URL encoded
 *
 */
export function decode(data: string): Combiner {
  data = decodeURIComponent(data);
  let isInString = false;
  let isExpectingVal = false;
  let nestingLevel = 0;
  let workingTree: {
    type: "str" | "(" | "expr";
    data: string;
    concluded: boolean;
  }[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isInString) {
      if (data[i] === "'") {
        isInString = false;
        workingTree[workingTree.length - 1].concluded = true;
      } else {
        workingTree[workingTree.length - 1].data += data[i];
      }
      continue;
    }
    if (data[i] === "'") {
      isInString = true;
      workingTree.push({ type: "str", data: "", concluded: false });
      continue;
    }
    if (data[i] === "(") {
      nestingLevel++;
      if (nestingLevel === 4) {
        throw new Error("Nesting level too deep");
      }
      workingTree.push({ type: "(", data: "", concluded: false });
      continue;
    }
    if (data[i] === ")") {
      nestingLevel--;
      if (nestingLevel < 0) {
        throw new Error("Unmatched parenthesis");
      }
      if (nestingLevel === 0) {
        workingTree[workingTree.length - 1].concluded = true;
      }
      continue;
    }
    if (workingTree[workingTree.length - 1].concluded) {
      workingTree.push({ type: "expr", data: "", concluded: false });
    }
    workingTree[workingTree.length - 1].data += data[i];
  }
  return workingTree;
}

console.log(decode("('))')"));

import { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import { Combiner, Operation, Operations } from "../types";

function recursiveOperations<
  DB,
  TB extends keyof DB,
  FN extends (
    op: Operation<any>,
    db: ExpressionBuilder<DB, TB>
  ) => ExpressionWrapper<DB, TB, SqlBool>
>(
  mode: "AND" | "OR",
  arr: Operations,
  db: ExpressionBuilder<DB, TB>,
  fun: FN
): ExpressionWrapper<DB, TB, SqlBool> {
  let fn = (op: Operations[number]) => {
    if ("mode" in op) {
      return recursiveKyselyCombiner(op, db, fun);
    } else {
      return fun(op, db);
    }
  };
  if (mode == "AND") {
    return db.and(arr.map(fn));
  } else {
    return db.or(arr.map(fn));
  }
}

export function recursiveKyselyCombiner<
  DB,
  TB extends keyof DB,
  FN extends (
    op: Operation<any>,
    db: ExpressionBuilder<DB, TB>
  ) => ExpressionWrapper<DB, TB, SqlBool>
>(combiner: Combiner, db: ExpressionBuilder<DB, TB>, fun: FN) {
  let { mode, operations } = combiner;
  if (mode == "NOT") {
    return db.not(recursiveOperations("AND", operations, db, fun));
  }
  return recursiveOperations(mode, operations, db, fun);
}

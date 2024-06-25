import {
  ExpressionBuilder,
  ExpressionWrapper,
  Nullable,
  SelectQueryBuilder,
  SqlBool,
  sql,
} from "kysely";
import {
  ColumnSchema,
  Combiner,
  Operation,
  Operations,
  decode,
} from "oss/packages/pinery";
import { Database } from "../../schema";

export const pinFilterSchema: ColumnSchema = {
  public: { type: "bool", mapsTo: "public", true: true },
  private: { type: "bool", mapsTo: "public", true: false },
  read: { type: "bool", mapsTo: "read", true: true },
  unread: { type: "bool", mapsTo: "read", true: false },
  created: { type: "date", mapsTo: "userentities.created_at" },
  updated: { type: "date", mapsTo: "userentities.updated_at" },
  title: { type: "string", mapsTo: "title" },
  tags: { type: "array", mapsTo: "tags" },
  desc: { type: "string", mapsTo: "description" },
};

type RequiredDb = Database & {
  tags: Nullable<{
    tags: string[];
  }>;
};
type RequiredTables = "userentities" | "entities" | "tags";

export function pinFilterEngine(
  filter: string,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let query = decode(filter, pinFilterSchema);
  return recursiveCombiner(query, db);
}

function recursiveOperations(
  mode: "AND" | "OR",
  arr: Operations,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
): ExpressionWrapper<RequiredDb, RequiredTables, SqlBool> {
  let fn = (op: Operations[number]) => {
    if ("mode" in op) {
      return recursiveCombiner(op, db);
    } else {
      return operationHandler(op, db);
    }
  };
  if (mode == "AND") {
    return db.and(arr.map(fn));
  } else {
    return db.or(arr.map(fn));
  }
}

function recursiveCombiner(
  combiner: Combiner,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let { mode, operations } = combiner;
  if (mode == "NOT") {
    return db.not(recursiveOperations("AND", operations, db));
  }
  return recursiveOperations(mode, operations, db);
}

function operationHandler(
  op: Operation<any>,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let { column, operator, value } = op;
  let cols:
    | "userentities.created_at"
    | "userentities.updated_at"
    | "read"
    | "public"
    | "description"
    | "title"
    | "tags"
    | ExpressionWrapper<RequiredDb, RequiredTables, string>;
  if (column == "title") {
    cols = db.cast(db.fn.coalesce("title_override", "title"), "text");
  } else {
    cols = column as any;
  }
  if (pinFilterSchema[column as keyof typeof pinFilterEngine].type == "array") {
    return db(cols, "&&", [value]);
  }
  if (operator == "^=") {
    console.log(cols, value);
    return db(cols, "like", `${value}%`);
  } else if (operator == "$=") {
    return db(cols, "like", sql`${value}%`.$castTo<string>());
  }
  return db(cols, operator, value);
}

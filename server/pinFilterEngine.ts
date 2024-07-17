import {
  ExpressionBuilder,
  ExpressionWrapper,
  Nullable,
  RawBuilder,
  sql,
} from "kysely";
import { Operation } from "oss/packages/pinery/types";
import { decode } from "oss/packages/pinery";
import { Database } from "../../schema";
import { recursiveKyselyCombiner } from "oss/packages/pinery/kysely";

export const pinFilterSchema = {
  public: { type: "bool", mapsTo: "public", true: true },
  private: { type: "bool", mapsTo: "public", true: false },
  read: { type: "bool", mapsTo: "read", true: true },
  unread: { type: "bool", mapsTo: "read", true: false },
  created: { type: "date", mapsTo: "userentities.created_at" },
  updated: { type: "date", mapsTo: "userentities.updated_at" },
  title: { type: "string", mapsTo: "title" },
  tags: { type: "array", mapsTo: "tags" },
  desc: { type: "string", mapsTo: "description" },
} as const;

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
  return recursiveKyselyCombiner(query, db, operationHandler);
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
    | ExpressionWrapper<RequiredDb, RequiredTables, string>
    | RawBuilder<unknown>;
  if (column == "title" && value.length > 1) {
    if (operator == "=") {
      cols = sql`user_data_search || title_search`;
    } else {
      cols = db.cast(db.fn.coalesce("title_override", "title"), "text");
    }
  } else {
    cols = column as any;
  }
  if (column == "title" && operator == "=") {
    if (2 > value.length) {
      return db.lit(true);
    }
    return db.parens(
      db.or([
        db(
          cols,
          "@@",
          db.fn("phraseto_tsquery", [sql.lit("english"), sql`${value}`])
        ),
        db(
          db.fn("lower", [db.fn.coalesce("title_override", "title")]),
          "like",
          "%" + value.toLowerCase() + "%"
        ),
      ])
    );
  }
  if (
    pinFilterSchema[column as keyof typeof pinFilterEngine]?.type == "array"
  ) {
    return db(cols, "@>", [value]);
  }
  if (operator == "^=") {
    return db(cols, "like", `${value}%`);
  } else if (operator == "$=") {
    return db(cols, "like", sql`${value}%`.$castTo<string>());
  }
  return db(cols, operator, value);
}

import {
  ExpressionBuilder,
  ExpressionWrapper,
  Nullable,
  RawBuilder,
  sql,
} from "kysely";
import type { Operation } from "!packages/pinery/types";
import { decode } from "!packages/pinery";
import type { Database } from "schema";
import { recursiveKyselyCombiner } from "!packages/pinery/kysely";

export const noteFilterSchema = {
  public: { type: "bool", mapsTo: "public", true: true },
  private: { type: "bool", mapsTo: "public", true: false },
  read: { type: "bool", mapsTo: "read", true: true },
  unread: { type: "bool", mapsTo: "read", true: false },
  created: { type: "date", mapsTo: "userentities.created_at" },
  updated: { type: "date", mapsTo: "userentities.updated_at" },
  title: { type: "string", mapsTo: "title" },
  tags: { type: "array", mapsTo: "tags" },
  desc: { type: "string", mapsTo: "description" },
  domain: { type: "string", mapsTo: "domain" },
} as const;

type RequiredDb = Database & {
  tags: Nullable<{
    tags: string[];
  }>;
};
type RequiredTables = "userentities" | "entities" | "tags";

export function noteFilterEngine(
  filter: string,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let query = decode(filter, noteFilterSchema);
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
  cols = column as any;

  if (
    noteFilterSchema[column as keyof typeof noteFilterSchema]?.type == "array"
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

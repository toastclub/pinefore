import { ExpressionBuilder, ExpressionWrapper, RawBuilder, sql } from "kysely";
import type { Operation } from "!packages/pinery/types";
import { decode } from "!packages/pinery";
import type { Database } from "schema";
import { recursiveKyselyCombiner } from "!packages/pinery/kysely";

export const feedFilterSchema = {
  tags: { type: "array", mapsTo: "tags" },
  feed_id: { type: "number", mapsTo: "ufeeds.id" },
} as const;

type RequiredDb = Database & {
  ufeeds: {
    id: number;
    title: string;
    tags: string[];
    url: string;
  };
};
type RequiredTables = "entities" | "rssfeeditems" | "ufeeds";

export function feedFilterEngine(
  filter: string,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let query = decode(filter, feedFilterSchema);
  return recursiveKyselyCombiner(query, db, operationHandler);
}

function operationHandler(
  op: Operation<any>,
  db: ExpressionBuilder<RequiredDb, RequiredTables>
) {
  let { column, operator, value } = op;
  let cols:
    | "tags"
    | ExpressionWrapper<RequiredDb, RequiredTables, string>
    | RawBuilder<unknown>;
  cols = column as any;

  if (
    feedFilterSchema[column as keyof typeof feedFilterSchema]?.type == "array"
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

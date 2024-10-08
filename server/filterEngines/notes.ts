import { ExpressionBuilder, ExpressionWrapper, RawBuilder, sql } from "kysely";
import type { Operation } from "!packages/pinery/types";
import { decode } from "!packages/pinery";
import type { Database } from "schema";
import { recursiveKyselyCombiner } from "!packages/pinery/kysely";

export const noteFilterSchema = {
  created: { type: "date", mapsTo: "entitynotes.created_at" },
  colour: { type: "string", mapsTo: "colour" },
  url: { type: "string", mapsTo: "url" },
  domain: { type: "string", mapsTo: "domain" },
} as const;

type RequiredDb = Database;
type RequiredTables = "entitynotes" | "entities";

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
    | "colour"
    | "url"
    | "domain"
    | "entitynotes.created_at"
    | ExpressionWrapper<RequiredDb, RequiredTables, string>
    | RawBuilder<unknown>;
  cols = column as any;

  if (
    // @ts-expect-error no columns are of array type
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

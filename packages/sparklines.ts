import { sql } from "kysely";
import { db } from "lib/db";

export async function dbSparklines(u: number) {
  return db
    .with("minmax", (db) =>
      db
        .selectFrom("userentities")
        .select([
          sql`EXTRACT(EPOCH FROM MIN(created_at))`.as("min"),
          sql`EXTRACT(EPOCH FROM MAX(created_at))`.as("max"),
        ])
        .where("userentities.user_id", "=", u)
    )
    .with("buckets", (db) =>
      db
        .selectFrom("userentities")
        .select([
          "created_at",
          (c) =>
            c
              .fn("width_bucket", [
                sql`EXTRACT(EPOCH FROM created_at)`,
                c.parens(c.selectFrom("minmax").select("min")),
                c.parens(c.selectFrom("minmax").select("max")),
                c.lit(30),
              ])
              .as("bucket"),
        ])
    )
    .selectFrom("buckets")
    .select(["bucket", (c) => c.fn.countAll().as("count")])
    .groupBy("bucket")
    .orderBy("bucket")
    .execute()
    .then((r) =>
      Object.fromEntries(r.map((r) => [Number(r.bucket) - 1, Number(r.count)]))
    );
}

export function svgSparklines(sparklines: { [k: number]: number }) {
  let maxY = Math.max(...Object.values(sparklines));
  let array =
    "M" +
    Object.entries(sparklines)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => ` ${k} ${maxY - v} `)
      .join("L");
  let maxX = Math.max(...Object.keys(sparklines).map(Number));
  return {
    viewbox: `0 0 ${maxX} ${maxY}`,
    path: array,
  };
}

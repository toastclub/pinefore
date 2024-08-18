import { sql, type Kysely } from "kysely";
import type { Database } from "schema";

export default async function accountMaintenance(db: Kysely<Database>) {
  await db
    .selectFrom("users")
    .select([
      (s) =>
        s
          .case()
          .when(
            "renewal_date",
            ">",
            sql.lit("now() + interval '30 days'").$castTo<Date>()
          )
          .then("delete")
          .end()
          .as("status"),
    ]);
}

import { Kysely, sql } from "kysely";
import { Database } from "schema";

export function recEntities(entity: number, db: Kysely<Database>) {
  return db
    .selectFrom("entities")
    .orderBy(
      sql`title_embeddings <-> (SELECT title_embeddings FROM entities WHERE id = ${entity})`
    )
    .where("id", "!=", entity)
    .limit(10);
}

import { Kysely } from "kysely";
import { Database } from "schema";

export async function getOrCreateFeedEntity(url: string, db: Kysely<Database>) {
  let feed = await db
    .selectFrom("rssfeeds")
    .where("url", "=", url)
    .selectAll()
    .executeTakeFirst();
  if (!feed) {
    return await db
      .insertInto("rssfeeds")
      .values({
        url,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
      .then((f) => f.id as number);
  }
  return feed.id as number;
}

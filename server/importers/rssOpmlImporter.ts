import { importOPML } from "!packages/rss/opml";
import { Kysely } from "kysely";
import { Database } from "schema";

export async function rssOpmlImporter(
  user_id: number,
  opml: string,
  db: Kysely<Database>
) {
  const feeds = importOPML(opml).items.filter((feed) => feed.xmlUrl);
  let dbFeeds = await db
    .with("feed", (c) =>
      c
        .insertInto("rssfeeds")
        .values(feeds.map((feed) => ({ url: feed.xmlUrl! })))
        .returning(["id", "url"])
        .onConflict((oc) => oc.column("url").doNothing())
    )
    .selectFrom("feed")
    .unionAll(
      db
        .selectFrom("rssfeeds")
        .where(
          "url",
          "in",
          feeds.map((feed) => feed.xmlUrl!)
        )
        .select(["id", "url"])
    )
    .select(["id", "url"])
    .execute();

  let inserted = await db
    .insertInto("userfeeds")
    .values(
      dbFeeds.map((feed) => ({
        user_id,
        feed_id: feed.id,
        feed_name: feeds.find((f) => f.xmlUrl === feed.url)?.title,
      }))
    )
    .onConflict((oc) => oc.doNothing())
    .returning(["id"])
    .execute();
  // todo: categories
  return inserted.length;
}

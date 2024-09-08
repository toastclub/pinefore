import { importOPML } from "!packages/rss/opml";
import { Kysely } from "kysely";
import { Database } from "schema";

export async function rssOpmlImporter(
  user_id: number,
  opml: string,
  db: Kysely<Database>
) {
  let feeds = importOPML(opml).items.filter((feed) => feed.xmlUrl);
  let alreadyExistingFeeds = await db
    .selectFrom("rssfeeds")
    .where(
      "url",
      "in",
      feeds.map((feed) => feed.xmlUrl!)
    )
    .select(["url"])
    .execute();
  let dbFeeds = await db
    .with(
      "feed",
      (c) =>
        c
          .insertInto("rssfeeds")
          .values(
            feeds
              // do the filtering here so the union returns the correct values
              .filter(
                (f) => !alreadyExistingFeeds.find((a) => a.url === f.xmlUrl)
              )
              .map((feed) => ({ url: feed.xmlUrl! }))
          )
          .returning(["id", "url"])
      //.onConflict((oc) => oc.column("url").doNothing())
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
  let alreadyExistingUserFeeds = await db
    .selectFrom("userfeeds")
    .where("user_id", "=", user_id)
    .select(["feed_id"])
    .execute();
  let inserted = await db
    .insertInto("userfeeds")
    .values(
      dbFeeds
        .filter(
          (feed) => !alreadyExistingUserFeeds.find((a) => a.feed_id === feed.id)
        )
        .map((feed) => ({
          user_id,
          feed_id: feed.id,
          feed_name: feeds.find((f) => f.xmlUrl === feed.url)?.title,
        }))
    )
    .returning(["id"])
    .execute();
  // todo: categories
  return inserted.length;
}

import { Kysely } from "kysely";
import { Database } from "../../schema";
import { fetchRSSFeed } from "oss/packages/rss";
import { BaselimeLogger } from "@baselime/edge-logger";

async function runOnFeed(
  db: Kysely<Database>,
  feed: {
    id: number;
    url: string;
    last_fetched_at: string;
  },
  logger?: BaselimeLogger
) {
  const res = await fetchRSSFeed(feed.url, {
    lastFetched: feed.last_fetched_at,
  });
  if (res.data == null) {
    logger?.error("Failed to fetch RSS feed", {
      url: feed.url,
      error: res.status,
    });
    return;
  }
  const entities = await db
    .insertInto("entities")
    .values(
      res.data.items.flatMap((item) => {
        if (item.link == undefined) return [];
        return [
          {
            url: item.link,
            title: item.title || "",
            posted_at: item.isoDate ? new Date(item.isoDate) : null,
          },
        ];
      })
    )
    .onConflict((oc) => oc.column("url").doNothing())
    .returning(["id", "url"])
    .execute();
  let itms = db
    .insertInto("rssfeeditems")
    .values(
      entities.map((entity) => ({
        feed_id: feed.id,
        entity_id: entity.id,
        discovered_at: new Date(),
      }))
    )
    .onConflict((oc) => oc.columns(["feed_id", "entity_id"]).doNothing())
    .execute();
  await db
    .updateTable("rssfeeds")
    .set({
      last_fetched_at: new Date(),
      next_fetch_time: getBackoff(
        // TODO: it would be better to use feed hashes but we aren't doing that right now
        new Date(feed.last_fetched_at || Date.now() + 1000 * 60 * 60 * 12)
      ),
    })
    .execute();
  await itms;
}

function getBackoff(lastUpdate: Date) {
  const hours = Math.floor(
    (Date.now() - lastUpdate.getTime()) / 1000 / 60 / 60
  );
  const jitter = Math.round((0.85 + Math.random() * 0.3) * 100) / 100;
  const backoff = Math.pow(hours, 0.3) - 1 * jitter;
  const clamped = Math.min(Math.max(backoff, 0.25), 24);
  return new Date(Date.now() + clamped * 60 * 60 * 1000);
}

export default async function rssQueue(db: Kysely<Database>, queue: any) {
  const feed = await fetchRSSFeed(queue.url, {
    lastFetched: queue.last_fetched_at,
  });
}

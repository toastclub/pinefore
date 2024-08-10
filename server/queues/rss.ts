import { Kysely } from "kysely";
import { Database } from "../../../schema";
import { fetchRSSFeed, RSSFeedResponse } from "oss/packages/rss";
import { getTimemap } from "oss/packages/timemachine/memento";
import { rootDomain } from "../helpers/root-domain";

async function runOnFeed(
  db: Kysely<Database>,
  feed: {
    id: number;
    url: string;
    last_fetched_at: string;
  }
) {
  const res = await fetchRSSFeed(feed.url, {
    lastFetched: feed.last_fetched_at,
  });
  if (res.data == null) {
    console.error("Failed to fetch RSS feed", {
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
            domain: rootDomain(item.link),
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

async function backfillFeed(feed: RSSFeedResponse, url: string, limit: number) {
  let tm = await getTimemap(["wayback"], url);
  // sort newest first
  function reduce(feed: RSSFeedResponse) {
    if (feed.data == null) {
      return false;
    }
    let _last =
      feed.data.items[feed.data.items.length - 1].isoDate ||
      feed.data.lastUpdated;
    if (_last == undefined) {
      return false;
    }
    let last = new Date(_last);
    tm = tm
      .sort((a, b) => b.tz.getTime() - a.tz.getTime())
      .filter((m) => m.tz > last);
  }
  if (reduce(feed) == false) {
    return;
  }
  for (let i = 0; i < limit; i++) {
    let _feed = await fetchRSSFeed(tm[0].url, {
      lastFetched: tm[0].tz.toISOString(),
    });
    if (_feed.data == null) {
      break;
    }
    // todo: dedupe
    feed.data!.items = feed.data!.items.concat(_feed.data.items);
    if (_feed.data.items.length < 2) {
      break;
    }
    if (reduce(_feed) == false) {
      return;
    }
  }
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

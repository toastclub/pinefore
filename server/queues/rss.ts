import type { Kysely } from "kysely";
import type { Database } from "schema";

import { fetchRSSFeed, RSSFeedResponse } from "!packages/rss";
import { getTimemap } from "!packages/timemachine/memento";

import { rootDomain } from "!server/helpers";

import type { RSSQueueBody } from "./types";

export async function feedsQueue(db: Kysely<Database>, feeds: RSSQueueBody[]) {
  for (const feed of feeds) {
    await runOnFeed(db, feed);
  }
}

export async function runOnFeed(db: Kysely<Database>, feed: RSSQueueBody) {
  const res = await fetchRSSFeed(feed.url, {
    lastFetched: feed.last_fetched_at || undefined,
  });
  if (res.data == null) {
    console.error("Failed to fetch RSS feed", {
      url: feed.url,
      error: res.status,
    });
    await db
      .updateTable("rssfeeds")
      .set({
        next_fetch_time: getBackoff(
          new Date(feed.last_fetched_at || Date.now() - 1000 * 60 * 60 * 12)
        ),
      })
      .where("id", "=", feed.id)
      .execute();
    return res;
  }
  try {
    const items = res.data.items.flatMap((item) => {
      let date = item.isoDate ? new Date(item.isoDate) : null;
      if (date && isNaN(date.getTime())) {
        date = null;
      }
      if (item.link == undefined) return [];
      return [
        {
          url: item.link,
          domain: rootDomain(item.link),
          title: item.title || "",
          posted_at: date,
        },
      ];
    });
    let alreadyExistingEntities = await db
      .selectFrom("entities")
      .where(
        "url",
        "in",
        items.map((entity) => entity.url)
      )
      .select(["url", "id"])
      .execute();
    let entitiesToInsert = items.filter((entity) => {
      return !alreadyExistingEntities.find((a) => a.url === entity.url);
    });
    const entities =
      entitiesToInsert.length > 0
        ? await db
            .insertInto("entities")
            .values(
              items.filter((entity) => {
                return !alreadyExistingEntities.find(
                  (a) => a.url === entity.url
                );
              })
            )
            //.onConflict((oc) => oc.column("url").doNothing())
            .returning(["id", "url"])
            .execute()
        : [];
    let itms = db
      .insertInto("rssfeeditems")
      .values(
        [...entities, ...alreadyExistingEntities].map((entity) => ({
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
          new Date(res.data.lastUpdated || Date.now() - 1000 * 60 * 60 * 12)
        ),
      })
      .where("id", "=", feed.id)
      .execute();

    await itms;
    return res;
  } catch (e) {
    console.error("Failed to insert feed items", e);
    return res;
  }
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
      lastFetched: tm[0]?.tz?.toISOString(),
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
  // get the number of hours since the last update
  const hours = Math.floor(
    (Date.now() - lastUpdate.getTime()) / 1000 / 60 / 60
  );
  // add some jitter to the backoff, a multiplier between 0.85 and 1.15
  const jitter = Math.round((0.85 + Math.random() * 0.3) * 100) / 100;
  // hours^0.3 * jitter
  const backoff = Math.pow(hours, 0.3) - 1 * jitter;
  const clamped = Math.min(Math.max(backoff, 0.25), 24);
  return new Date(Date.now() + clamped * 60 * 60 * 1000);
}

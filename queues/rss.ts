import { Kysely } from "kysely";
import { Database } from "../../schema";
import { fetchRSSFeed } from "oss/packages/rss";

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

import type { Kysely } from "kysely";
import type { Database } from "schema";
import { chunks } from "lib/types";
import type { MiniQueueMessage } from "../queues/types";

export default async function rssCron(
  db: Kysely<Database>,
  queue: Queue<MiniQueueMessage>
) {
  let needsUpdate = await db
    .selectFrom("rssfeeds")
    .select(["url", "id", "last_fetched_at"])
    .where((c) =>
      c.or([
        c("next_fetch_time", "<", (c) => c.fn<Date>("now")),
        c("next_fetch_time", "is", null),
      ])
    )
    .execute();
  if (needsUpdate.length === 0) {
    return;
  }

  for (const chunk of chunks(needsUpdate, 10)) {
    await queue.send({
      type: "rss",
      body: chunk.map((c) => ({
        ...c,
        last_fetched_at: c.last_fetched_at?.toISOString(),
      })),
    });
  }
}

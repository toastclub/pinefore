import { Kysely } from "kysely";
import { Database } from "../../../schema";
import { chunks } from "lib/types";
import { MiniQueueMessage } from "../queues/types";

export default async function rssCron(
  db: Kysely<Database>,
  queue: Queue<MiniQueueMessage>
) {
  let needsUpdate = await db
    .selectFrom("rssfeeds")
    .select(["url", "id", "last_fetched_at"])
    .where("next_fetch_time", "<", (c) => c.fn<Date>("now"))
    .execute();
  if (needsUpdate.length === 0) {
    return;
  }

  for (const chunk of chunks(needsUpdate, 10)) {
    queue.send({
      type: "rss",
      body: chunk.map((c) => ({
        ...c,
        last_fetched_at: c.last_fetched_at.toISOString(),
      })),
    });
  }
}

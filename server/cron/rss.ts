import { Kysely } from "kysely";
import { Database } from "../../schema";
import { chunks } from "lib/types";

export default async function rssCron(db: Kysely<Database>, queue: any) {
  let needsUpdate = await db
    .selectFrom("rssfeeds")
    .select(["url", "id", "last_fetched_at"])
    .where("next_fetch_time", "<", (c) => c.fn<Date>("now"))
    .execute();
  if (needsUpdate.length === 0) {
    return;
  }
  /**
   * There are a few possibly incorrect assumptions at play here:
   * 1. It is assumed that the queue worker will also be bounded by the 50 subrequest limit
   * 2. It is assumed that with n max batch size, this limit will not be exceeded, however
   * this is possible if enough large tasks get pushed, if enough feeds redirect, etc
   * 3. It is assumed that the attempt to batch will be cheaper. If this is not the case,
   * we can adapt.
   */
  for (const chunk of chunks(needsUpdate, 10)) {
    queue.send(chunk);
  }
}

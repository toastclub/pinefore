import type { MessageBatch } from "@cloudflare/workers-types";
import type { MiniQueueMessage } from "./types";

import { feedsQueue } from "./rss";

import type { Env } from "$index";
import { db } from "$db";

export default async function handleQueue(
  event: MessageBatch<MiniQueueMessage>,
  env: Env
) {
  if (!env.CONNECTION_STRING && !env.HYPERDRIVE.connectionString) {
    console.log(env);
    throw new Error("No connection string provided");
  }
  const kysely = db(env.CONNECTION_STRING || env.HYPERDRIVE.connectionString);
  for (const message of event.messages) {
    if (message.body.type == "rss") {
      await feedsQueue(kysely, message.body.body);
    }
  }
}

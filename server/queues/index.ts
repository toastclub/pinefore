import { MessageBatch } from "@cloudflare/workers-types";
import { Env } from "be/index";
import { db } from "be/db";
import { feedsQueue } from "./rss";
import { MiniQueueMessage } from "./types";

export default async function handleQueue(
  event: MessageBatch<MiniQueueMessage>,
  env: Env
) {
  const kysely = db(env.HYPERDRIVE.connectionString);
  for (const message of event.messages) {
    if (message.body.type == "rss") {
      await feedsQueue(kysely, message.body.body);
    }
  }
}

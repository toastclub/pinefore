import { MessageBatch } from "@cloudflare/workers-types";
import { Env } from "../../../server/index";
import { db } from "../../../server/db";

export default async function handleQueue(event: MessageBatch, env: Env) {
  const kysely = db(env.HYPERDRIVE.connectionString);
  const queue = env.MINI_QUEUE;
  if (event.queue == "rss") {
    rssCron(kysely, queue);
  }
}

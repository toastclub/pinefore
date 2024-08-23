import type { Env } from "$index";
import { db } from "$db";

import rssCron from "./rss";

export async function handleCron(event: ScheduledController, env: Env) {
  const kysely = db(env.CONNECTION_STRING || env.HYPERDRIVE.connectionString);
  // 12 UTC is 7 AM EST and 1 PM CEST (Berlin)
  // We run at the 23rd minute to be good citizens
  if (event.cron == "25 12 * * *") {
    // Account maintenance
  }
  // Run every 12 minutes to check for RSS
  if (event.cron == "*/12 * * * *") {
    rssCron(kysely, env.MINI_QUEUE);
  }
}

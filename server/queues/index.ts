export default async function handleQueue(event: Queue, env: Env) {
  const kysely = db(env.HYPERDRIVE.connectionString);
  const queue = env.MINI_QUEUE;
  if (event.queue == "rss") {
    rssCron(kysely, queue);
  }
}

# How to escape <img width=150 src="https://github.com/user-attachments/assets/9db7ec9d-ceb6-4caf-83a3-11518dbfd158" alt="Cloudflare"/>

## Aux

1. Domains are registered with Cloudflare. Transfer them using [this](https://developers.cloudflare.com/registrar/account-options/transfer-out-from-cloudflare/) guide.
2. DNS is managed by Cloudflare. Transfer it away.
3. The frontend and the backend are both hosted on workers. Using cloudflare, the `/api` route is proxied to the backend. Assuming that you wish to ditch the cloud, NGINX is perhaps the most easy solution.

## Frontend

We use nitro, which has dozens of presets. You could simply change the `cloudflare-pages` preset to `node-server`, `bun`, or `deno-server`, and I expect that is all.

## Backend

This is where it gets tricky, we use a lot of cloudflare services. I expect that this migration could be done within a couple of hours, still.

### Hyperdrive

Hyperdrive maintains a persistent connection to our database. Our database configuration is rougly defined as follows

```ts
const db = (connectionString: string) => new Kysely(...)
export const dbMiddleware = new Elysia({ name: "db" }).derive(
  { as: "global" },
  async ({ cookie, request, env }) => (
    {
      db: db(env.HYPERDRIVE.connectionString),
    };
  )
);
```

Notably, the db is instantiated _every_ request. This is bad for performance because a handshake is done each instantiation. Cloudflare does not support dangling promises (promises that continue outside a request), but hyperdrive's persistent connection resolves this. Because of this, simply cache an instance of `db` in the top level and return it here and you should be good to go.

### R2

We store some data on R2, a S3 competitor. We use the interface for workers for performance. We've also implemented S3 mirrors of the API, and intend to do one for local storage as well.

We also need to figure out how to _download_ all data. [`s5cmd`](https://github.com/peak/s5cmd) could work well for this.

### Queues + Cron

We use cloudflare workers for queues and cron jobs. We could use a service like [`bullmq`](https://github.com/taskforcesh/bullmq) for this. This is low priority because the service can work without queues for a couple hours.

### KV

Our KV usage is incredibly minimal. We can go without it.

### AI

We have no AI in use.

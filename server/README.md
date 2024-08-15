# Server

Lib files that are run exclusively on the server side of the application.

## Folders

### Cron

Background tasks

### Helpers

See local README.md

### Importers

- Netscape style HTML importer
- Pinefore style JSON importer

### Metadata

Metadata extraction code for various sites. May be turned into a package.

### Middlewares

#### auth.ts

The code for our authentication middleware.

#### captcha.ts

The captcha provider for the server.

### Queues

Cron tasks often run to push tasks into the queue. The reasoning for queues is scalability. Workers have a limit of ~1000 requests, and often times multiple requests are required. RSS feeds, for instance, can require 10. This means that one CRON job has the theoretical limit of 100 RSS feeds. Not a lot. By contrast, each queue push contains 10 jobs, and there are 999 remaining requests, giving us 9990 feeds. Still not a lot actually, but 100x better. Eventually this will move server-side.

### Ranking

All ranking code for the site.

### Storage

File storage code for the site. Not all of this code is used in production.

One goal of our project is to have very little platform dependency. This means that we can easily switch between cloud providers or even host our own servers. We currently use Cloudflare R2 for Workers in production, but we'd like to have a drop-in replacement for this service. We currently have two: `S3` which abstracts any S3-like storage service, and `Local` which is a local file storage service.

### Misc

#### commonSchema.ts

Open source schema information.

#### pinFilterEngine.ts

An extension of the pinery package for pin filtration

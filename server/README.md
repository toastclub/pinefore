# Server

Lib files that are run exclusively on the server side of the application.

## Folders

### CRON

Background tasks

### Helpers

See local README.md

### Importers

- Netscape style HTML importer
- Pinefore style JSON importer

### Metadata

Metadata extraction code for various sites. May be turned into a package.

### Queues

Cron tasks often run to push tasks onto the queue.

### Ranking

All ranking code for the site.

### Storage

File storage code for the site. Not all of this code is used in production.

One goal of our project is to have very little platform dependency. This means that we can easily switch between cloud providers or even host our own servers. We currently use Cloudflare R2 for workers in production, but we'd like to have a drop-in replacement for this service. We currently have two: `S3` which abstracts any S3-like storage service, and `Local` which is a local file storage service.

## Files

### Middleware

#### auth.ts

The authentication middleware for the server.

#### captcha.ts

The captcha provider for the server.

#### cbor.ts

Deprecated CBOR serialization middleware.

#### logger.ts

Logger middleware for the server.

### Misc

#### commonSchema.ts

Open source schema information.

#### pinFilterEngine.ts

An extension of the pinery package for pin filtration

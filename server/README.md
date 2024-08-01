# Server

Lib files that are run exclusively on the server side of the application.

### Folders

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

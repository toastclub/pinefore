# RSS

Pinefore's RSS library.

- Supports RSS 1.0, 2.0, and Atom
- Supports importing and exporting OPML
- Supports fetching feeds, with support for ETag and Last-Modified headers
- Can find feeds on a page
- Highly fault tolerant
- Fully typed
- Two direct dependencies: `xml-js` and `@std/html`
- Is tested

Please be aware of the following limitations:

- The feed finding feature uses Regular Expressions instead of a proper parser. It has not been tested for performance.

## Usage

```ts
import { fetchRSSFeed, findFeeds } from "./index";

const feed = await fetchRSSFeed("https://example.com/feed.xml", {});
if (feed.status == "error" || feed.status == "not-parsable") {
  console.error("Failed to fetch feed");
  console.log(await findFeeds("https://example.com"));
} else {
  console.log(feed.feed);
}
```

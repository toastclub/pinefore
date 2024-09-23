# RSS

<img align="right" width=125 src="https://github.com/user-attachments/assets/d89d3544-fb66-4776-8cbe-9ba4c21154f4"/>

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

## Credits

- Much of our own code is derived from Miniflux's excellent RSS parser: [Miniflux](https://github.com/miniflux/v2/tree/main/internal/reader)
- In the event of ambiguity, Robert Brennan's [rss-parser](https://github.com/rbren/rss-parser) package was used as a reference

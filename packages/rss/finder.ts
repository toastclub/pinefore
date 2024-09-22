/**
 * This code is derived from miniflux's feed finder:
 * {@link https://github.com/miniflux/v2/blob/c326d5574b4d50d5097604f0808773ddf5e6d051/internal/reader/subscription/finder.go#L52-L130}
 */

const WELL_KNOWN_FEED_URLS = [
  "atom.xml",
  "feed.xml",
  "feed/",
  "rss.xml",
  "rss/",
  "index.rss",
  "index.xml",
  "feed.atom",
];

const LINK_TYPES = [
  "application/rss+xml",
  "application/atom+xml",
  "application/xml",
  "text/xml",
];

export function feedFinder() {}

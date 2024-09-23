/**
 * This code is derived from miniflux's feed finder:
 * {@link https://github.com/miniflux/v2/blob/c326d5574b4d50d5097604f0808773ddf5e6d051/internal/reader/subscription/finder.go#L52-L130}
 */

import { FEED_FETCHER_USER_AGENT, GENERIC_USER_AGENT } from "!constants";
import { parseRSSFeed } from ".";

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

// borrowed from favicon.ts
function checkForFeedsInHTML(html: string, url: URL) {
  const feeds = new Set<string>();
  for (const link of html.match(/<link.*?>/g) || []) {
    let rel = link.match(/rel=((?:"([^"]*)")|(?:[^ '>"]*)|(?:'([^']*)'))/);
    let href = link.match(/href=((?:"([^"]*)")|(?:[^ '>"]*)|(?:'([^']*)'))/);
    if (rel && href) {
      if (!href[1].startsWith("/")) href[1] = "/" + href[1];
      if (LINK_TYPES.includes(rel[1].toLowerCase())) {
        feeds.add(new URL(href[1], url).toString());
      }
    }
  }
  return feeds;
}

/**
 * For fetches likely to return generic HTML, we use the generic user agent.
 * For fetches likely to return feeds, we use the feed fetcher user agent.
 * In total, up to 11 fetches are made. The last 8 fetches are made in parallel.
 */
export async function feedFinder(
  url: URL,
  options?: {
    /**
     * If true, the URL passed in will be fetched.
     * If a string, the string will be used as the response (saving a fetch).
     * If false, only child URLs will be checked.
     */
    currentURL?: string | boolean;
  }
) {
  const urlStr = url.toString();
  // 1) Check if the URL is a feed itself
  if (typeof options?.currentURL === "string" || options?.currentURL === true) {
    const response =
      typeof options.currentURL === "string"
        ? options.currentURL
        : await (
            await fetch(urlStr, {
              headers: {
                "User-Agent": GENERIC_USER_AGENT,
              },
            })
          ).text();
    try {
      const feed = parseRSSFeed(response);
      if (feed.mode) {
        return [url];
      }
    } catch (e) {
      // noop
    }

    // 2) Check for feed links in the HTML
    const feeds = checkForFeedsInHTML(response, url);
    if (feeds.size) {
      return Array.from(feeds);
    }
  }
  // 3) For a given /1/2/3/4/5.html, check the directory for feed URLs, as well as the root
  const directories = new Set<string>();

  // a) Check the directory of the current URL
  const currentPath = url.pathname.split("/").slice(0, -1).join("/") + "/";
  directories.add(new URL(currentPath, url).toString());
  // b) Check the root URL
  directories.add(new URL("/", url).toString());
  // Loop through the directories and check for feeds
  for (const directory of directories) {
    const directoryResponse = await (
      await fetch(directory, {
        headers: {
          "User-Agent": GENERIC_USER_AGENT,
        },
      })
    ).text();
    const dirFeeds = checkForFeedsInHTML(directoryResponse, new URL(directory));
    if (dirFeeds.size) {
      return Array.from(dirFeeds);
    }
  }

  // 4) Check for well-known feed URLs in the root
  const wellKnownFeeds = WELL_KNOWN_FEED_URLS.map((feed) =>
    new URL("/" + feed, url).toString()
  );
  // run in parallel, return the first one that works
  const wellKnownFeed = await Promise.any(
    wellKnownFeeds.map(async (feed) => {
      try {
        const response = await (
          await fetch(feed, {
            headers: {
              "User-Agent": FEED_FETCHER_USER_AGENT,
            },
          })
        ).text();
        const parsed = parseRSSFeed(response);
        if (parsed.mode) {
          return feed;
        }
      } catch (e) {
        // noop
      }
      return null;
    })
  );
  if (wellKnownFeed) {
    return [wellKnownFeed];
  }

  return [];
}

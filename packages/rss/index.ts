import { xml2js } from "xml-js";
import { atomParser } from "./atom";
import { rssParser } from "./rss";
import { unescape } from "@std/html/entities";
import entityList from "@std/html/named-entity-list.json" with { type: "json" };
import { FEED_FETCHER_USER_AGENT } from "!constants";

export interface PaginationLinks {
  self?: string;
  first?: string;
  next?: string;
  last?: string;
  prev?: string;
}

export interface RSSFeed {
  paginationLinks?: PaginationLinks;
  items: RSSItem[];
  link?: string;
  feedUrl?: string;
  title?: string;
  subtitle?: string;
  lastUpdated?: string;
  language?: string;
}

export interface RSSItem {
  link?: string;
  guid?: string;
  title?: string;
  pubDate?: string;
  creator?: string;
  summary?: string;
  content?: string;
  isoDate?: string;
  categories?: string[];
  contentSnippet?: string;
}

interface RSSFeedExtra {
  etag?: string;
  hash?: string;
}

export type RSSFeedResponse = (
  | {
      /**
       * A number of heuristics are used to determine the feed type.
       *
       * - If the feed contains the `feed` top level element, it is assumed to be an Atom feed.
       */
      mode: "rss" | "atom" | "rdf" /*| "json" | "rss-0.9"*/;
      data: RSSFeed;
    }
  | {
      mode: null;
      data: null;
      status: "error" | "not-modified" | "not-parseable";
      /**
       * The error that occurred during parsing, if any.
       */
      error?: any;
      /**
       * If the feed is not parseable but looks like HTML, this is set to true.
       */
      canPossiblyBeHTML?: boolean;
      /**
       * In the case of an error, the fetched feed is returned.
       */
      fetchedFeed?: string;
    }
) & {
  extra?: RSSFeedExtra;
  status_code?: number;
};

export function textOrCData(data: any) {
  let d = (data?.[0]?._text?.[0] || data?.[0]?._cdata?.[0])?.trim();
  if (d) {
    return unescape(d, { entityList });
  }
  return d;
}

/**
 * This fetcher is designed to be failable, and will attempt to parse unsemantic feeds.
 */
export async function fetchRSSFeed(
  url: string,
  options: {
    lastFetched?: string;
    etag?: string;
    // When the server indicates that the feed has not been modified, the default is do not parse further.
    alwaysFetch?: boolean;
  }
): Promise<RSSFeedResponse> {
  const headers = { "User-Agent": FEED_FETCHER_USER_AGENT } as Record<
    string,
    string
  >;
  if (options.lastFetched) {
    headers["If-Modified-Since"] = options.lastFetched;
  }
  if (options.etag) {
    options.etag = options.etag.replace("W/", "");
    headers["If-None-Match"] = options.etag.startsWith('"')
      ? options.etag
      : `"${options.etag}"`;
  }
  const res = await fetch(url, { headers });
  const extra: RSSFeedExtra = {};
  if (res.headers.get("ETag")) {
    extra.etag = res.headers.get("ETag")!;
  }
  if (res.status === 304 && !options.alwaysFetch) {
    return {
      mode: null,
      data: null,
      status: "not-modified",
      extra,
      status_code: res.status,
    };
  }
  let feed = parseRSSFeed(await res.text(), extra);
  return {
    ...feed,
    status_code: res.status,
  };
}

export function parseRSSFeed(
  feed: string,
  extra?: RSSFeedExtra
): RSSFeedResponse {
  let parsed: any;
  feed = feed.trim();
  let canPossiblyBeHTML =
    feed.startsWith("<!DOCTYPE html>") ||
    feed.startsWith("<html>") ||
    feed.startsWith("<!doctype html>");
  try {
    parsed = xml2js(feed, {
      compact: true,
      ignoreComment: true,
      alwaysArray: true,
    });
  } catch (e) {
    return {
      mode: null,
      data: null,
      status: "error",
      error: e,
      canPossiblyBeHTML,
      fetchedFeed: feed,
      extra,
    };
  }
  try {
    if (parsed.feed?.[0] != undefined) {
      return { mode: "atom", data: atomParser(parsed), extra };
    } else if (parsed.rss?.[0] != undefined) {
      if (parsed.rss[0]._attributes?.version === "2.0") {
        return { mode: "rss", data: rssParser(parsed.rss[0]), extra };
      }
    } else if (parsed["rdf:RDF"]?.[0] != undefined) {
      parsed = parsed["rdf:RDF"][0];
      parsed.channel[0].item = parsed.item;
      delete parsed.item;
      return { mode: "rdf", data: rssParser(parsed), extra };
    }
  } catch (e) {
    return {
      mode: null,
      data: null,
      status: "error",
      canPossiblyBeHTML,
      error: e,
      fetchedFeed: feed,
      extra,
    };
  }
  return {
    mode: null,
    data: null,
    status: "not-parseable",
    canPossiblyBeHTML,
    fetchedFeed: feed,
    extra,
  };
}

export { feedFinder } from "./finder";

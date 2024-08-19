/**
 * Rest in peace, Aaron Swartz.
 * I pledge to build this project in your honour.
 */

import { RSSFeed, RSSItem } from ".";

export function rssParser(data: any) {
  let feed: RSSFeed = {
    items: [],
  };
  feed.title = data.channel[0]?.title?.[0]?._text?.[0];
  feed.link = data.channel[0]?.link?.[0]?._text?.[0];
  feed.subtitle = data.channel[0]?.description?.[0]._text?.[0];
  feed.language = data.channel[0]?.language?.[0]?._text?.[0];
  feed.lastUpdated = data.channel[0]?.lastBuildDate?.[0]?._text?.[0];
  feed.items = data.channel[0]?.item.map(rssItemParser).filter((e: any) => e);
  return feed;
}

function rssItemParser(data: any): RSSItem | null {
  if (data.link[0]?._text?.[0] === undefined) {
    return null;
  }
  let item = {
    title: data.title?.[0]?._text?.[0],
    link: data.link?.[0]?._text?.[0],
    guid: data.guid?.[0]?._text?.[0],
    content:
      data["dc:content"]?.[0]?._text?.[0] ||
      data["content:encoded"]?.[0]?._text?.[0],
    summary: data.description?.[0]?._text?.[0],
    pubDate: data.pubDate?.[0]?._text?.[0],
    isoDate: data.pubDate?.[0]?._text?.[0],
    creator:
      data.author?.[0]?._text?.[0] || data["dc:creator"]?.[0]?._text?.[0],
    categories: data.category
      ?.map((c: any) => c._text?.[0])
      .filter((e: any) => e),
  };
  return item;
}

import { RSSFeed, RSSItem } from ".";

export function rssParser(data: any) {
  let feed: RSSFeed = {
    items: [],
  };
  feed.title = data.channel[0]?.title[0]?._text;
  feed.link = data.channel[0]?.link[0]?._text;
  feed.subtitle = data.channel[0]?.description[0]?._text;
  feed.language = data.channel[0]?.language[0]?._text;
  feed.lastUpdated = data.channel[0]?.lastBuildDate[0]?._text;
  feed.items = data.channel[0]?.item.map(rssItemParser).filter((e: any) => e);
  return feed;
}

function rssItemParser(data: any): RSSItem | null {
  let item = {
    title: data.title[0]?._text,
    link: data.link[0]?._text,
    guid: data.guid[0]?._text,
    content: data["content:encoded"][0]?._text,
    summary: data.description[0]?._text,
    pubDate: data.pubDate[0]?._text,
    isoDate: data.pubDate[0]?._text,
    creator: data.author[0]?._text,
    categories: data.category?.map((c: any) => c._text),
  };
  return item;
}

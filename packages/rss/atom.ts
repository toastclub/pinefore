import { RSSFeed, RSSItem, textOrCData } from ".";

export function atomParser(data: any) {
  let feed: RSSFeed = {
    items: [],
  };
  data.feed[0]?.link.forEach((element: any) => {
    if (element._attributes.rel === "self") {
      feed.feedUrl = element._attributes.href;
    } else if (element._attributes.rel === "alternate") {
      feed.link = element._attributes.href;
    }
  });
  feed.title = data.feed[0]?.title[0]?._text?.[0];
  feed.subtitle = data.feed[0]?.subtitle[0]?._text?.[0];
  let updated_at = data.feed[0]?.updated[0]?._text?.[0];
  if (updated_at) {
    updated_at = new Date(updated_at);
    if (!Number.isNaN(updated_at.getTime())) {
      feed.lastUpdated = updated_at.toISOString();
    }
  }
  feed.items = data.feed[0]?.entry.map(atomEntryParser).filter((e: any) => e);
  return feed;
}

function atomEntryParser(entry: any) {
  if (entry.link[0]?._attributes.href === undefined) {
    return null;
  }
  let item: RSSItem = {
    title: textOrCData(entry.title),
    link: entry.link?.[0]?._attributes.href,
    guid: entry.id?.[0]?._text?.[0],
    content: textOrCData(entry.content),
    summary: textOrCData(entry.summary),
    pubDate: entry.published?.[0]?._text?.[0],
    isoDate: entry.updated?.[0]?._text?.[0],
    creator: entry.author?.[0]?.name[0]?._text?.[0],
    categories: entry.category?.map((c: any) => c._attributes.term),
  };
  return item;
}

import { RSSFeed } from ".";
import { js2xml } from "xml-js";

export function generateAtomFeed(feed: RSSFeed) {
  const createTextElement = (text: string) => ({ _text: text });
  const createLinkElement = (href: string, rel: string) => ({
    _attributes: { href, rel },
  });

  let atomFeed = {
    _declaration: {
      _attributes: {
        version: "1.0",
        encoding: "utf-8",
      },
    },
    feed: {
      _attributes: {
        xmlns: "http://www.w3.org/2005/Atom",
      },
    },
  } as any;

  if (feed.title) atomFeed.feed.title = createTextElement(feed.title);
  if (feed.link || feed.feedUrl) {
    atomFeed.feed.link = [
      createLinkElement((feed.link || feed.feedUrl)!, "alternate"),
    ];
  }
  if (feed.feedUrl || feed.link)
    atomFeed.feed.link.push(
      createLinkElement((feed.feedUrl || feed.link)!, "self")
    );
  if (feed.lastUpdated)
    atomFeed.feed.updated = createTextElement(feed.lastUpdated);
  if (feed.subtitle) atomFeed.feed.subtitle = createTextElement(feed.subtitle);

  atomFeed.feed.entry = feed.items.map((item) => {
    let entry: any = {};
    if (item.title) entry.title = createTextElement(item.title);
    if (item.link) entry.link = [createLinkElement(item.link, "alternate")];
    if (item.guid) entry.id = createTextElement(item.guid);
    if (item.content) entry.content = createTextElement(item.content);
    if (item.summary) entry.summary = createTextElement(item.summary);
    if (item.pubDate) entry.published = createTextElement(item.pubDate);
    if (item.isoDate) entry.updated = createTextElement(item.isoDate);
    if (item.creator) {
      entry.author = [{ name: createTextElement(item.creator) }];
    }
    if (item.categories) {
      entry.category = item.categories.map((c) => ({
        _attributes: { term: c },
      }));
    }
    return entry;
  });

  return js2xml(atomFeed, { compact: true, spaces: 2 });
}

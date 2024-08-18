import { it, expect, describe, beforeAll, spyOn, afterAll } from "bun:test";
import { fetchRSSFeed } from "./index";
import { readFile } from "fs/promises";

let urlMap: Record<string, string> = {
  "https://example.com": "example.com.html",
  "https://rss.nytimes.com": "nytimes.com.xml",
  "https://old.rss.nytimes.com": "nytimes.old.xml",
  "https://boehs.org": "boehs.org.xml",
  "https://www.mnot.net": "mnot.net.xml",
};

beforeAll(() => {
  spyOn(global, "fetch").mockImplementation(
    // @ts-expect-error
    async (url: RequestInfo, init: RequestInit | undefined) => {
      if (init?.headers) {
        const headers = new Headers(init.headers);
        let etag = headers.get("If-None-Match");
        if (etag == '"aa"') {
          return new Response("", {
            status: 304,
            headers: {
              ETag: 'W/"aa"',
            },
          });
        }
        const file = await readFile(
          // @ts-expect-error
          new URL(`./tests/data/${urlMap[url]}`, import.meta.url).pathname,
          "utf8"
        );
        return new Response(file, {
          status: 200,
          headers: {
            ETag: 'W/"aa"',
          },
        });
      }
    }
  );
});

afterAll(() => {
  // @ts-expect-error
  global.fetch.mockRestore();
});

describe("general", () => {
  it("fails on invalid url", async () => {
    let feed = await fetchRSSFeed("https://example.com", {});
    // @ts-expect-error
    expect(feed.status).toBe("not-parseable");
  });
});

describe("rss feeds", async () => {
  const nyt = await fetchRSSFeed("https://rss.nytimes.com", {});

  it("gets data from nyt", () => {
    expect(nyt.data).toBeTruthy();
    expect(nyt.data!.items.length).toBeGreaterThan(0);
  });

  it("detects type as rss", () => {
    expect(nyt.mode).toBe("rss");
  });

  const oldRss = await fetchRSSFeed("https://old.rss.nytimes.com", {});

  it("changes last updated", () => {
    expect(oldRss.data!.lastUpdated).not.toBe(nyt.data!.lastUpdated);
  });

  it("has no subtitle", () => {
    expect(nyt.data!.subtitle).toBeUndefined();
  });

  describe("items", () => {
    let firstItem = oldRss.data!.items[0];
    it("gets categories", () => {
      expect(firstItem.categories).toBeTruthy();
      expect(firstItem.categories!.length).toBeGreaterThan(0);
    });
    it("has correct categories", () => {
      expect(firstItem.categories![0]).toBeString();
    });
    it("parses pubDate", () => {
      // @ts-expect-error
      let date = new Date(firstItem.pubDate);
      expect(date).toBeDate();
      expect(date.getFullYear()).toEqual(2024);
    });
  });
});

describe("atom feeds", async () => {
  describe.each(["boehs.org", "www.mnot.net"])("%s", async (u) => {
    const feed = await fetchRSSFeed("https://" + u, {});
    it(`gets data`, () => {
      expect(feed.data).toBeTruthy();
      expect(feed.data!.items.length).toBeGreaterThan(0);
    });

    it("detects type as atom", () => {
      expect(feed.mode).toBe("atom");
    });

    it("has ETag", () => {
      expect(feed.extra.etag).toBeTruthy();
    });

    it("might have categories", () => {
      let categories = feed.data!.items[0].categories;
      if (categories) {
        expect(categories).toBeArray();
        expect(categories[0]).toBeString();
      } else {
        expect(categories).toBeUndefined();
      }
    });
  });

  it("supports ETag", async () => {
    let newFeed = await fetchRSSFeed("https://boehs.org", {
      etag: "aa",
    });
    expect(newFeed.mode).toBeNull();
    expect(newFeed.status).toBe("not-modified");
    let badEtag = await fetchRSSFeed("https://boehs.org", {
      etag: "bb",
    });
    expect(badEtag.mode).not.toBeNull();
    expect(badEtag.status).not.toBe("not-modified");
  });
});

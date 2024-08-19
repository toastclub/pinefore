import { it, expect, describe, beforeAll, spyOn, afterAll } from "bun:test";
import { fetchRSSFeed } from "./index";
import { readFile } from "fs/promises";

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
        let host = new URL(url.toString()).host + ".xml";
        if (host.startsWith("example.com")) {
          host = "example.com.html";
        }
        const file = await readFile(
          new URL(`./tests/data/${host}`, import.meta.url).pathname,
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
  describe("nytimes", async () => {
    const nyt = await fetchRSSFeed("https://rss.nytimes.com", {});

    it("detects type as rss", () => {
      expect(nyt.mode).toBe("rss");
    });

    it("changes last updated", async () => {
      expect(
        (await fetchRSSFeed("https://old.rss.nytimes.com", {})).data!
          .lastUpdated
      ).not.toBe(nyt.data!.lastUpdated);
    });

    it("has no subtitle", () => {
      expect(nyt.data!.subtitle).toBeUndefined();
    });

    describe("items", () => {
      let firstItem = nyt.data!.items[0];
      it("gets categories", () => {
        expect(firstItem.categories).toBeTruthy();
        expect(firstItem.categories!.length).toBeGreaterThan(0);
      });
      it("has correct categories", () => {
        expect(firstItem.categories![0]).toBeString();
      });
      it("parses author", () => {
        expect(firstItem.creator).toEqual("Shane Goldmacher");
      });
      it("parses pubDate", () => {
        let date = new Date(firstItem.pubDate);
        expect(date).toBeDate();
        expect(date.getFullYear()).toEqual(2024);
      });
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

    if (u == "www.mnot.net") {
      it("parses content", () => {
        expect(feed.data!.items[0].content).toBeTruthy();
      });
    }
  });

  it("supports ETag", async () => {
    let newFeed = await fetchRSSFeed("https://boehs.org", {
      etag: "aa",
    });
    expect(newFeed.mode).toBeNull();
    // @ts-expect-error
    expect(newFeed.status).toBe("not-modified");
    let badEtag = await fetchRSSFeed("https://boehs.org", {
      etag: "bb",
    });
    expect(badEtag.mode).not.toBeNull();
    // @ts-expect-error
    expect(badEtag.status).not.toBe("not-modified");
  });
});

describe("rdf feeds", async () => {
  describe("osnews", async () => {
    let feed = await fetchRSSFeed("https://osnews.com", {});
    it("parses title", () => {
      expect(feed.data?.items[0].title).toBe(
        "SailfishOS 2.0 released for early access users"
      );
    });
  });
});

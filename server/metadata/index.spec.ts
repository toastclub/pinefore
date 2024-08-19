import { test, expect, describe } from "bun:test";
import { getMeta } from "./index";

test("twitter.com", async () => {
  let meta = await getMeta("https://x.com/jack/status/20", {});
  expect(meta.mode).toBe("twitter");
  expect(meta.title).toBeNull();
  expect(meta.description).toBe("> just setting up my twttr");
});

let mastoTests = [
  ["local", "https://social.coop/@eb/112293574570479831"],
  [
    "foreign",
    "https://mastodon.social/@danirabbit@mastodon.online/112985058471920217",
  ],
];

describe("mastodon", async () => {
  describe.each(mastoTests)("%s", async (_, url) => {
    let meta = getMeta(url, {});
    test("detected as mastodon", () => {
      expect(meta).resolves.toHaveProperty("mode", "mastodon");
    });
    test("got body", async () => {
      expect((await meta).description).toStartWith("> ");
    });
  });
});

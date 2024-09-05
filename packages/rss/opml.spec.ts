import { it, expect, describe } from "bun:test";
import { readFile } from "fs/promises";
import { importOPML, exportOPML } from "./opml";

let opml = await readFile(
  new URL("./tests/data/opml/miniflux.opml", import.meta.url).pathname,
  "utf8"
);

describe("opml", () => {
  it("imports miniflux", () => {
    let parsed = importOPML(opml);
    expect(parsed.dateCreated).toBeDate();
    expect(parsed.title).toBe("Miniflux");
    expect(parsed.items.length).toBeGreaterThan(0);
  });
  it("exports miniflux", () => {
    let parsed = importOPML(opml);
    let exported = exportOPML(parsed);
    expect(exported).toBeString();
    expect(exported).toContain('<outline text="Media">');
  });
});

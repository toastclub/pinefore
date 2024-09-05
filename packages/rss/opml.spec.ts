import { it, expect, describe } from "bun:test";
import { readFile } from "fs/promises";
import { importOPML, exportOPML } from "./opml";

let opml = await readFile(
  new URL("./tests/data/opml/miniflux.opml", import.meta.url).pathname,
  "utf8"
);

describe("opml", () => {
  let parsed = importOPML(opml);
  it("imports miniflux", () => {
    expect(parsed.dateCreated).toBeDate();
    expect(parsed.title).toBe("Miniflux");
    expect(parsed.items.length).toBeGreaterThan(0);
  });
  it("supports multiple categories", () => {
    expect(
      parsed.items.find((i) => i.title == "Citation Needed (Molly White)")
        ?.categories
    ).toEqual(["Media", "People"]);
  });
  it("exports miniflux", () => {
    let exported = exportOPML(parsed);
    expect(exported).toBeString();
    expect(exported).toContain('<outline text="Media">');
  });
});

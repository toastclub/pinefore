import { describe, test, expect } from "bun:test";
import urlRewriter from "./urlRewriter";

const ampUrls = [
  ["google", "https://www.google.com/amp/www.example.com/amp/doc.html"],
  [
    "amp project",
    "https://www-example-com.cdn.ampproject.org/c/www.example.com/amp/doc.html",
  ],
];

test("rewrites url shorteners", () => {
  expect(urlRewriter("https://bit.ly/404")).resolves.toBe(
    "https://divtag.com/"
  );
});
describe("amp", () => {
  test.each(ampUrls)("%s", (_, u) => {
    expect(urlRewriter(u)).resolves.toBe(
      "https://www.example.com/amp/doc.html"
    );
  });
});
test("rewrites youtu.be", () => {
  expect(urlRewriter("https://youtu.be/jNQXAC9IVRw?si=aaaaa")).resolves.toBe(
    "https://www.youtube.com/watch?v=jNQXAC9IVRw"
  );
});
test("removes utm", () => {
  expect(urlRewriter("https://boehs.org/?utm_source=nowhere")).resolves.toBe(
    "https://boehs.org/"
  );
});

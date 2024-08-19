import { test, expect } from "bun:test";
import extractTitle from "./title";

let map = [
  [
    "nytimes",
    "The New York Times Will Stop Endorsing Candidates in New York Races - The New York Times",
    "https://www.nytimes.com/2024/08/12/business/media/the-new-york-times-editorial-board-political-endorsements.html",
    "The New York Times Will Stop Endorsing Candidates in New York Races",
  ],
  [
    "stackoverflow",
    "vi - How do I exit Vim? - Stack Overflow",
    "https://stackoverflow.com/questions/11828270/how-do-i-exit-vim",
    "vi - How do I exit Vim?",
  ],
];

test.each(map)("parses %p", (site, title, url, expected) => {
  expect(extractTitle(`<title>${title}</title>`, new URL(url))).toBe(expected);
});

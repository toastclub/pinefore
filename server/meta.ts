import { rootDomain } from "./helpers/root-domain";
import stringSimilarity from "./helpers/string-similarity";
import { decode } from "html-entities";

export async function getMeta(u: string) {
  let url = new URL(decodeURIComponent(u));
  let data = await (await fetch(url)).text();
  let titleMatchArr =
    data.match(
      /(?:(?:(?:og)|(?:twitter)):title" content="(.*)")|(?:<title(?:.*?)>(.*?)<\/title>)/
    ) || [];
  let titleMatch = titleMatchArr[1] || titleMatchArr[2] || null;
  if (titleMatch) {
    // Don't make modifications to the homepage
    if (url.pathname.length <= 1) {
    } else {
      let splittedTitle = titleMatch
        // A | B | C → ['A', '| B', '| C']
        .split(/(?=[\-–—|])/g);
      // Only run if there are multiple segments
      if (splittedTitle.length > 1) {
        titleMatch = splittedTitle
          .flatMap((ogStr) => {
            let str = ogStr.replace(/^[\-–—|]/, "").trim();
            // nytimes.com → nytimes
            let root = rootDomain(url.hostname);
            if (str.length > 30) return [ogStr];
            // Sørensen–Dice coefficient
            if (root && stringSimilarity(root, str) > 0.15) return [];
            return [ogStr];
          })
          .join("")
          .trim();
      }
    }
  }
  return {
    title: titleMatch ? decode(titleMatch) : null,
  };
}

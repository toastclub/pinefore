import { rootDomain } from "../helpers/root-domain";
import stringSimilarity from "../helpers/string-similarity";
import { decode } from "html-entities";
import { fetchTweet } from "./parsers/x.com";
import { AiHandler, callCfAiServerside } from "oss/packages/ai/genAi";
import { generateLLamaTitlePrompt } from "oss/packages/ai/title";

async function titleGen(text: string, ai: AiHandler | undefined) {
  if (ai) {
    let title = await callCfAiServerside(
      {
        text: generateLLamaTitlePrompt(text),
        model: "@cf/meta/llama-3-8b-instruct",
      },
      ai
    );
    if (title) {
      if (title.includes('"')) {
        title = title.split('"')[1];
      } else if (title.includes("'")) {
        title = title.split("'")[1];
      } else if (title.includes("“")) {
        title = title.split("“")[1];
      } else if (title.includes("‘")) {
        title = title.split("‘")[1];
      }
    }
    return title;
  }
}

export async function getMeta(
  u: string,
  pkg: {
    ai?: AiHandler;
  }
) {
  let url = new URL(decodeURIComponent(u));
  if (["x.com", "twitter.com"].includes(url.host) && pkg.ai) {
    let id = url.pathname.split("/")[3];
    if (id) {
      let t = await fetchTweet(id);
      if (t?.data?.text) {
        let txt = t.data.text;
        if (t.data.quoted_tweet) {
          txt = `in response to: "${t.data.quoted_tweet}"\n\n${t.data.text}`;
        }
        // https://social.coop/@eb/112797743728441302
        let title = await titleGen(txt, pkg.ai);
        let description = "> " + t.data.text;
        if (t.data.quoted_tweet) {
          description = `>> ${t.data.quoted_tweet}\n\n> ${t.data.text}`;
          return {
            mode: "twitter",
            title: title,
            description: description,
          };
        }
      }
    }
  }
  let data = await (await fetch(url)).text();
  if (data.length < 50000) {
    if (
      data.includes(
        'To use the Mastodon web application, please enable JavaScript. Alternatively, try one of the <a href="https://joinmastodon.org/apps">native apps</a> for Mastodon for your platform.'
      )
    ) {
      try {
        let mastodata = await (await fetch(url + ".json")).json();
        let title = mastodata.content
          ? await titleGen(mastodata.content, pkg.ai)
          : undefined;
        return {
          mode: "mastodon",
          title: title,
          description: mastodata.content.replace("</p><p>", "\n\n> "),
        };
      } catch (e) {}
    }
  }
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
    mode: "standard",
    title: titleMatch ? decode(titleMatch) : null,
  };
}

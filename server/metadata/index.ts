import { fetchTweet } from "./sites/twitter.com";
import { AiHandler, callCfAiServerside } from "!packages/ai/genAi";
import { generateLLamaTitlePrompt } from "!packages/ai/title";
import extractTitle from "./title";
import fetchToot from "./sites/mastodon";

const getExt = (u: URL) =>
  u.pathname.split(/[#?]/)?.[0]?.split(".").pop()?.trim();

export async function titleGen(text: string, ai: AiHandler | undefined) {
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
  if (["x.com", "twitter.com"].includes(url.host)) {
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
        }
        return {
          mode: "twitter",
          title: title || null,
          description: description,
        };
      }
    }
  }
  let data = await (await fetch(url)).text();
  let ext = getExt(url);
  if (ext == "pdf") {
    let tIdx = data.indexOf("/Title(");
    let title = data.substring(tIdx + 7, data.indexOf(")", tIdx + 7));
    return {
      mode: "pdf",
      title: title || null,
      description: null,
    };
  }
  let masto = await fetchToot(url, data, pkg);
  if (masto) return masto;
  return {
    mode: "standard",
    title: extractTitle(data, url),
    description: null,
  };
}

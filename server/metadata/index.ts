import { fetchTweet } from "./sites/twitter.com";
import { AiHandler, callCfAiServerside } from "!packages/ai/genAi";
import { generateLLamaTitlePrompt } from "!packages/ai/title";
import extractTitle from "./title";

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
          return {
            mode: "twitter",
            title: title || null,
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
        if (mastodata?.content) {
          let title = mastodata.content
            ? await titleGen(mastodata.content, pkg.ai)
            : null;
          return {
            mode: "mastodon",
            title: title || null,
            description:
              "> " +
              (mastodata.content as string)
                .replaceAll("</p><p>", "\n\n> ")
                .replaceAll("<p>", "")
                .replaceAll("</p>", "")
                .replaceAll("<br />", "\n> "),
          };
        }
      } catch (e) {}
    }
  }
  return {
    mode: "standard",
    title: extractTitle(data, url),
    description: null,
  };
}

import { AiHandler } from "!packages/ai/genAi";
import { titleGen } from "..";

export default async function fetchToot(
  url: URL,
  data: string,
  pkg: {
    ai?: AiHandler;
  }
) {
  let possiblyMastodon = url.pathname
    .split("/")?.[1]
    ?.match(/@?([A-z0-9._%+-]+)(?:@([A-z0-9.-]+\.[A-z]{2,}))?/);
  if (possiblyMastodon && url.pathname.split("/") && data.length < 50000) {
    let last = url.pathname.split("/")[2];
    if (
      last &&
      (data.includes(
        'To use the Mastodon web application, please enable JavaScript. Alternatively, try one of the <a href="https://joinmastodon.org/apps">native apps</a> for Mastodon for your platform.'
      ) ||
        // redirect notice
        data.includes('alt="Mastodon" class="logo logo--icon"'))
    ) {
      try {
        url = new URL(`https://${url.host}/api/v1/statuses/${last}`);
        let mastodata = await (await fetch(url)).json();
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
}

import { FEED_FETCHER_USER_AGENT } from "!constants";

export async function getFavicon(url: string) {
  let headers = new Headers();
  headers.set("User-Agent", FEED_FETCHER_USER_AGENT);
  let data = await fetch(url + "/favicon.ico", { headers });

  if (data.status == 200 || data.status == 301) {
    return data.arrayBuffer();
  }

  let html = await (await fetch(url, { headers })).text();

  let keys = [
    "icon",
    "shortcut icon",
    "apple-touch-icon",
    "apple-touch-icon-precomposed",
    "apple-touch-icon-precomposed.png",
  ];

  for (const link of html.match(/<link.*?>/g) || []) {
    let rel = link.match(/rel="([^"]*)"/);
    let href = link.match(/href="([^"]*)"/);
    if (rel && href) {
      if (!href[1].startsWith("/")) href[1] = "/" + href[1];
      if (keys.includes(rel[1].toLowerCase())) {
        console.log(link, rel[1], href[1], new URL(href[1], url).toString());
        let iconUrl = new URL(href[1], url).toString();
        return fetch(iconUrl, { headers }).then((data) => data.arrayBuffer());
      }
    }
  }
}

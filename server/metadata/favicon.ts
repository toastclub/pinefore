import { GENERIC_USER_AGENT } from "!constants";

export async function getFavicon(url: string) {
  let headers = new Headers();
  headers.set("User-Agent", GENERIC_USER_AGENT);

  let html = await (await fetch(url, { headers })).text();

  let keys = [
    "icon",
    "shortcut icon",
    "apple-touch-icon",
    "apple-touch-icon-precomposed",
    "apple-touch-icon-precomposed.png",
  ];

  for (const link of html.match(/<link.*?>/g) || []) {
    let rel = link.match(/rel=((?:"([^"]*)")|(?:[^ '>"]*)|(?:'([^']*)'))/);
    let href = link.match(/href=((?:"([^"]*)")|(?:[^ '>"]*)|(?:'([^']*)'))/);
    if (rel && href) {
      if (!href[1].startsWith("/")) href[1] = "/" + href[1];
      if (rel[1].startsWith('"')) rel[1] = rel[1].slice(1, -1);
      if (rel[1].startsWith("'")) rel[1] = rel[1].slice(1, -1);
      if (keys.includes(rel[1].toLowerCase())) {
        if (href[1].startsWith("data:")) {
          // data:[<media type>][;charset=<character set>][;base64],<data>
        }
        let iconUrl = new URL(href[1], url).toString();
        return fetch(iconUrl, { headers }).then((data) => data.arrayBuffer());
      }
    }
  }

  let data = await fetch(url + "/favicon.ico", { headers });

  if (data.status == 200 || data.status == 301) {
    return data.arrayBuffer();
  }
}

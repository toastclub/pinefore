import { MaybePromise } from "elysia";

export default async function urlRewriter(url: string) {
  const u = new URL(url);
  if (u.hostname == "youtu.be") {
    return "https://youtube.com/watch?v=" + u.pathname.slice(1);
  }
  if (
    (u.hostname == "www.google.com" || u.hostname == "www.bing.com") &&
    u.pathname.startsWith("/amp/s/")
  ) {
    return urlRewriter("https://" + u.pathname.slice(6));
  }
  // remove link shorteners
  if (
    [
      "d.to",
      "e.vg",
      "t.co",
      "t.ly",
      "v.gd",
      "y.gy",
      "is.gd",
      "ow.ly",
      "bit.ly",
      "dub.sh",
      "goo.gl",
      "buff.ly",
      "tiny.cc",
      "rebrand.ly",
      "shorturl.at",
      "tinyurl.com",
    ].includes(u.hostname)
  ) {
    return await fetch(url).then((r): MaybePromise<string | undefined> => {
      if (![301, 308].includes(r.status)) return;
      let loc = r.headers.get("location");
      if (!loc) return url;
      return urlRewriter(loc);
    });
  }
  // remove ampproject
  if (u.hostname == "www.ampproject.org") {
    return urlRewriter("https://" + u.searchParams.get("url")!);
  }
}

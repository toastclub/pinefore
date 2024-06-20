export function proxyMatcher(url: URL): [string, string] | null {
  if (url.hostname == "www.youtube.com" || url.hostname == "youtube.com") {
    if (url.searchParams.get("v")) return ["yt", url.searchParams.get("v")!];
  }
  if (url.hostname == "youtu.be") {
    return ["yt", url.pathname.slice(1)];
  }
  return null;
}

export function toProxyURL(url: string): string | null {
  const u = new URL(url);
  const match = proxyMatcher(u);
  if (!match) return null;
  return `/api/helper/media/proxy/${match[0]}/${match[1]}`;
}

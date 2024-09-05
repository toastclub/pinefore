export function proxyMatcher(url: URL): [string, string] | null {
  if (url.hostname == "www.youtube.com" || url.hostname == "youtube.com") {
    if (url.searchParams.get("v")) return ["yt", url.searchParams.get("v")!];
  }
  if (url.hostname == "youtu.be") {
    return ["yt", url.pathname.slice(1)];
  }
  return null;
}

export function getMediaType(url: URL) {
  switch (proxyMatcher(url)?.[0]) {
    case "yt":
      return "video";
    default:
      return null;
  }
}

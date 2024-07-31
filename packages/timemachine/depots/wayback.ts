export function getRawWaybackURL(url: string | URL) {
  if (typeof url === "string") {
    url = new URL(url);
  }
  const path = url.pathname.split("/");
  path[1] = path[1] + "_id";
  url.pathname = path.join("/");
  return url;
}

import { fetchRSSFeed } from "..";

while (true) {
  const url = prompt("Enter URL");
  console.log(await fetchRSSFeed(url, {}).then((r) => [r, r.data?.items]));
}

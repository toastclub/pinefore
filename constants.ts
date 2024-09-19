export const MODE = import.meta.env.MODE;
export const ENDPOINT =
  MODE == "development" ? "localhost:3000" : "pinefore.com";
export const PROTOCOL = MODE == "development" ? "http://" : "https://";
export const BASE_URL = `${PROTOCOL}${ENDPOINT}`;
export const FEED_FETCHER_USER_AGENT =
  "Pinefore/1.0 ( https://pinefore.com; like FeedFetcher-Google)";
// Pinefore does not wish to use this user agent, but has found it necessary
// as some sites block requests with non-standard user agents, even for tasks
// like favicon fetching.
export const GENERIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

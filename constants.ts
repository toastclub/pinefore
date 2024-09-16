export const MODE = import.meta.env.MODE;
export const ENDPOINT =
  MODE == "development" ? "localhost:3000" : "pinefore.com";
export const PROTOCOL = MODE == "development" ? "http://" : "https://";
export const BASE_URL = `${PROTOCOL}${ENDPOINT}`;
export const FEED_FETCHER_USER_AGENT =
  "Pinefore/1.0 ( https://pinefore.com; like FeedFetcher-Google)";

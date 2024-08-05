export const MODE = import.meta.env.MODE;
export const ENDPOINT =
  MODE == "development" ? "localhost:3000" : "pinefore.com";
export const PROTOCOL = MODE == "development" ? "http://" : "https://";
export const BASE_URL = `${PROTOCOL}${ENDPOINT}`;

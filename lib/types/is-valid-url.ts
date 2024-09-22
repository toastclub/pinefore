export default function isValidHttpUrl(string: string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return ["http:", "https:"].includes(url.protocol);
}

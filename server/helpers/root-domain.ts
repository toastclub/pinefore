import psl from "psl";
export function rootDomain(url: string) {
  let parsed = psl.parse(url);
  if (parsed.error) return null;
  if (
    parsed.subdomain &&
    [
      "www",
      "m",
      "en",
      "es",
      "fr",
      "de",
      "it",
      "ja",
      "ko",
      "pt",
      "ru",
      "zh",
    ].includes(parsed.subdomain)
  )
    return parsed.sld;
  // honestly just always return the sld
  return parsed.sld;
}

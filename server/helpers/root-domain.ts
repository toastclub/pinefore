import { parse } from "tldts";
export function rootDomain(url: string) {
  let parsed = parse(url, { allowPrivateDomains: true });
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
    return parsed.domainWithoutSuffix;
  // honestly just always return the sld
  return parsed.domainWithoutSuffix;
}

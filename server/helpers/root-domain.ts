// adapted from https://stackoverflow.com/questions/41604540/get-root-domain-name-without-extension-javascript
export function rootDomain(url: string) {
  let rightPeriodIndex, noExtension;
  for (let i = url.length - 1; i >= 0; i--) {
    if (url[i] == ".") {
      rightPeriodIndex = i;
      noExtension = url.substr(0, i);
      break;
    }
  }
  return noExtension?.substring(noExtension.lastIndexOf(".") + 1);
}

var CHARSET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function encode(int: number) {
  if (int === 0) {
    return CHARSET[0];
  }
  let res = "";
  while (int > 0) {
    res = CHARSET[int % 62] + res;
    int = Math.floor(int / 62);
  }
  return res;
}

export function decode(str: string) {
  let res = 0,
    length = str.length,
    i,
    char;
  for (i = 0; i < length; i++) {
    char = str.charCodeAt(i);
    if (char < 58) {
      char = char - 48;
    } else if (char < 91) {
      char = char - 29;
    } else {
      char = char - 87;
    }
    res += char * Math.pow(62, length - i - 1);
  }
  return res;
}

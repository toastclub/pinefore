export function colourContrast(rgb: [number, number, number], c: number) {
  return rgb.map((v) => c * (v - 128) + 128) as [number, number, number];
}

export function colourBrightness(rgb: [number, number, number], b: number) {
  return rgb.map((v) => v * b) as [number, number, number];
}

export function colourSaturation(rgb: [number, number, number], s: number) {
  let min = rgb.indexOf(Math.min.apply(null, rgb)), // index of min
    max = rgb.indexOf(Math.max.apply(null, rgb)), // index of max
    mid = [0, 1, 2].filter(function (i) {
      return i !== min && i !== max;
    })[0],
    a = rgb[max] - rgb[min],
    b = rgb[mid] - rgb[min],
    x = rgb[max],
    arr = [x, x, x];
  if (min === max) {
    min = 2; // both max = min = 0, => mid = 1, so set min = 2
    a = 1; // also means a = b = 0, don't want division by 0 in `b / a`
  }

  arr[max] = x;
  arr[min] = Math.round(x * (1 - s));
  arr[mid] = Math.round(x * (1 - s + (s * b) / a));

  return arr as [number, number, number];
}

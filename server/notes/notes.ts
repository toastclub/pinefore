const COLOR_NAMES = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
];

export function validateColor(color: string) {
  if (COLOR_NAMES.includes(color)) {
    return true;
  }
  // is it a #fff, #ffffff, or #ffffffff?
  if (color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/i)) {
    return true;
  }
  if (color.startsWith("#")) {
    return "Invalid Hex";
  }
  return "Invalid Color Name";
}

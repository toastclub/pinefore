const COLOUR_NAMES = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
];

export function validateColour(colour: string) {
  if (COLOUR_NAMES.includes(colour)) {
    return true;
  }
  // is it a #fff, #ffffff, or #ffffffff?
  if (colour.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/i)) {
    return true;
  }
  if (colour.startsWith("#")) {
    return "Invalid Hex";
  }
  return "Invalid Colour Name";
}

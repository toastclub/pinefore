const PREVIEW_MAX_LENGTH = 150;
export const renderWhiteSpace = (text: string) => {
  if (text.length >= PREVIEW_MAX_LENGTH) {
    return null;
  }
  const whiteSpaceCodes = "\xa0\u200C\u200B\u200D\u200E\u200F\uFEFF";
  return `<div>${whiteSpaceCodes.repeat(
    PREVIEW_MAX_LENGTH - text.length
  )}</div>`;
};

import { micromark } from "micromark";
import {
  gfmAutolinkLiteral,
  gfmAutolinkLiteralHtml,
} from "micromark-extension-gfm-autolink-literal";
import {
  gfmStrikethrough,
  gfmStrikethroughHtml,
} from "micromark-extension-gfm-strikethrough";

export async function safeMd(input: string) {
  let md = micromark(input, {
    extensions: [
      gfmAutolinkLiteral(),
      gfmStrikethrough(),
      { disable: { null: ["labelStartImage"] } },
    ],
    htmlExtensions: [gfmAutolinkLiteralHtml(), gfmStrikethroughHtml()],
  });
  return md;
}

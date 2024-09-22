import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

/// This isn't sanitized
/// Carefully verify DOMPurify compat
export default function readability(page: string) {
  const { document } = parseHTML(page);
  let article = new Readability(document).parse();
}

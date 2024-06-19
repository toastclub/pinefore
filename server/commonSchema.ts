import { t } from "elysia";

let tag = t.Array(t.String({ maxLength: 75 }), {
  maxItems: 25,
  description: "repeating query string, like `&tag=growing-up&tag=filmmaking`",
  examples: [["growing-up", "filmmaking"]],
});

let importers: {
  [key: string]: {
    title: string;
    fileTypes: string[];
    fileExtensions: string[];
  };
} = {
  html: {
    title: "HTML Bookmarks",
    fileTypes: ["text/html"],
    fileExtensions: [".html"],
  },
  delicious: {
    title: "Delicious XML",
    fileTypes: ["text/xml"],
    fileExtensions: [".xml"],
  },
  pinboard: {
    title: "Pinboard JSON",
    fileTypes: ["application/json"],
    fileExtensions: [".json"],
  },
};

export { importers };

export default {
  tag,
  tags: t.Optional(
    t.Union([
      tag,
      t.String({
        maxLength: 76 * 25,
        description: "space-delimited list of tags",
        examples: [["growing-up filmmaking"]],
      }),
    ])
  ),
  username: t.String({
    minLength: 3,
    maxLength: 16,
    pattern: "^[a-z0-9_-]*$",
    description: "Username must be lowercase with only a-z0-9_-",
  }),
  email: t.Lowercase(
    t.String({ format: "email", maxLength: 320, examples: ["evan@boehs.org"] })
  ),
  password: t.String({ minLength: 8, maxLength: 128 }),
};

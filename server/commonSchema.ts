import { t } from "elysia";

let tag = t.Array(t.String({ maxLength: 75 }), {
  maxItems: 25,
  description: "repeating query string, like `&tag=growing-up&tag=filmmaking`",
  examples: [["growing-up", "filmmaking"]],
});

export const importers: {
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
  pinefore: {
    title: "Pinefore Backup",
    fileTypes: ["application/json"],
    fileExtensions: [".json"],
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

export const exporters: {
  [key: string]: {
    title: string;
  };
} = {
  pinefore: {
    title: "Pinefore Backup",
  },
};

const commonSchema = {
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

export default commonSchema;

export const modernPin = t.Object({
  id: t.String(),
  user_id: t.Number(),

  title: t.String({
    examples: ["Letter To A Young Programmer Considering A Startup"],
  }),
  entity: t.Object({
    id: t.String(),
    title: t.Optional(t.String()),
    created_at: t.Date({ format: "date-time" }),
    url: t.String({
      examples: [
        "https://al3x.net/2013/05/23/letter-to-a-young-programmer.html",
      ],
      format: "uri",
    }),
  }),
  description: t.String({ examples: [""] }),
  tags: t.Nullable(commonSchema.tag),
  created_at: t.Date({ format: "date-time" }),
  updated_at: t.Nullable(t.Date({ format: "date-time" })),
  public: t.Boolean(),
  read: t.Boolean(),
});

export const createModernPin = t.Object({
  url: t.String({
    examples: ["https://al3x.net/2013/05/23/letter-to-a-young-programmer.html"],
    format: "uri",
  }),
  title: t.String({
    examples: ["Letter To A Young Programmer Considering A Startup"],
  }),
  description: t.Optional(t.String({ examples: [""] })),
  tags: t.Optional(commonSchema.tags),
  public: t.Optional(t.Boolean()),
  read: t.Optional(t.Boolean()),
  created_at: t.Optional(t.Date({ format: "date-time" })),
});

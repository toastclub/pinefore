import { t } from "elysia";

let tag = t.Array(t.String({ maxLength: 75 }), {
  maxItems: 25,
  description: "repeating query string, like `&tag=growing-up&tag=filmmaking`",
  examples: [["growing-up", "filmmaking"]],
});
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
  email: t.Lowercase(t.String({ format: "email", maxLength: 320 })),
  password: t.String({ minLength: 8, maxLength: 128 }),
};

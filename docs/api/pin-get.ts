import { t } from "elysia";

export const pinGetSchema = {
  query: t.Object({
    where: t.Optional(
      t.String({
        description:
          "A powerful filtering engine. Please refer to the [query engine](/docs/query-engine) documentation for more information.",
      })
    ),
    user: t.Optional(t.Numeric({ description: "The user ID to look for" })),
    scope: t.Optional(
      t.Union([t.Literal("user"), t.Literal("community"), t.Literal("network")])
    ),
    count: t.Optional(t.Numeric({ maximum: 1000, default: 30 })),
    page: t.Optional(t.Numeric({ default: 0 })),
  }),
};

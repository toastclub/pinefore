import { t } from "elysia";

export const jsonFeedAuthor = t.Object({
  name: t.String({ description: "The name of the author" }),
  url: t.Optional(t.String({ description: "The URL of the author" })),
  avatar: t.Optional(
    t.String({ description: "The URL of the avatar of the author" })
  ),
});

export const jsonFeedItem = t.Object({
  id: t.String({ description: "The unique identifier of the item" }),
  url: t.Optional(t.String({ description: "The URL of the item" })),
  external_url: t.Optional(
    t.String({ description: "The external URL of the item" })
  ),
  title: t.String({ description: "The title of the item" }),
  content_text: t.Optional(
    t.String({ description: "The text content of the item" })
  ),
  content_html: t.Optional(
    t.String({ description: "The HTML content of the item" })
  ),
  summary: t.Optional(
    t.String({ description: "A summary or description of the item" })
  ),
  image: t.Optional(
    t.String({ description: "The URL of the main image of the item" })
  ),
  banner_image: t.Optional(
    t.String({ description: "The URL of the banner image of the item" })
  ),
  date_published: t.Optional(
    t.Date({ description: "The date the item was published" })
  ),
  date_modified: t.Optional(
    t.Date({ description: "The date the item was modified" })
  ),
  authors: t.Optional(t.Array(jsonFeedAuthor)),
  author: t.Optional(jsonFeedAuthor),
  tags: t.Optional(t.Array(t.String({ description: "The tags of the item" }))),
  language: t.Optional(t.String({ description: "The language of the item" })),
});

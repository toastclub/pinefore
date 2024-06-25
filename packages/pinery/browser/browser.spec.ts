import { it, expect, describe } from "bun:test";
import { decode, encode } from "./index";

const schema = {
  user_id: { type: "number", mapsTo: "user_id" },
  created_at: { type: "date", mapsTo: "created_at" },
  tags: { type: "array", mapsTo: "tags" },
} as const;

describe("browser decode", () => {
  let str = "user_id=1+created_at>2021-01-01+tags=tag1,tag2+tags!=tag3";
  let output = {
    user_id: { "=": 1 },
    created_at: { ">": new Date("2021-01-01") },
    tags: {
      "=": ["tag1", "tag2"],
      "!=": ["tag3"],
    },
  };
  it("can decode a simple query", () => {
    // @ts-expect-error
    expect(decode(str, schema)).toStrictEqual(output);
  });
  it("can encode a simple query", () => {
    // @ts-expect-error
    expect(encode(output, schema)).toStrictEqual(str);
  });
  it("can reencode a simple query", () => {
    expect(encode(decode(str, schema), schema)).toStrictEqual(str);
  });
  decode("user_id=1+created_at>2021-01-01+tags=tag1,tag2+tags!=tag3", schema);
});

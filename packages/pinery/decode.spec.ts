import { it, expect, describe } from "bun:test";
import { ColumnSchema, decode, decodeToAST } from "./decode";

describe("decodeToAST", () => {
  it("understands strings", () => {
    expect(decodeToAST("(')hello()')")).toStrictEqual([
      {
        type: "parn",
        data: [{ type: "str", data: ")hello()", concluded: true }],
        concluded: true,
      },
    ]);
  });

  it("nests", () => {
    expect(decodeToAST("((()))")).toStrictEqual([
      {
        type: "parn",
        data: [
          {
            type: "parn",
            data: [{ type: "parn", data: [], concluded: true }],
            concluded: true,
          },
        ],
        concluded: true,
      },
    ]);
  });
});

const schema: ColumnSchema = {
  public: { type: "bool", mapsTo: "public", true: true },
  private: { type: "bool", mapsTo: "public", true: false },
  read: { type: "bool", mapsTo: "read", true: true },
  unread: { type: "bool", mapsTo: "read", true: false },
  date: { type: "date", mapsTo: "date" },
  title: { type: "string", mapsTo: "title" },
  tags: { type: "array", mapsTo: "tags" },
  desc: { type: "string", mapsTo: "desc" },
};

describe("decode", () => {
  describe("basic", () => {
    it("decodes a bool", () => {
      expect(decode("public", schema)).toStrictEqual({
        mode: "AND",
        operations: [{ operator: "=", column: "public", value: true }],
      });
    });
    it("throws if bool is assigned", () => {
      expect(() => decode("public=a", schema)).toThrow();
    });
    it("decodes a string", () => {
      expect(decode("title=test", schema)).toStrictEqual({
        mode: "AND",
        operations: [{ operator: "=", column: "title", value: "test" }],
      });
    });
    it("decodes a 'string'", () => {
      expect(decode("title='test'", schema)).toStrictEqual({
        mode: "AND",
        operations: [{ operator: "=", column: "title", value: "test" }],
      });
    });
    it("throws on string'string'", () => {
      expect(() => decode("title=t'est'", schema)).toThrow();
    });
    it("decodes a date", () => {
      expect(decode("date=2021-03-03", schema)).toStrictEqual({
        mode: "AND",
        operations: [
          { operator: "=", column: "date", value: new Date("2021-03-03") },
        ],
      });
    });
    it("throws on bad dates", () => {
      expect(() => decode("date=2021--03-03", schema)).toThrow("Invalid date");
    });
    it("decodes an array", () => {
      expect(decode("tags=hello,world", schema)).toStrictEqual({
        mode: "AND",
        operations: [
          { operator: "=", column: "tags", value: ["hello", "world"] },
        ],
      });
    });
  });
  describe("joining", () => {
    it("joins AND", () => {
      expect(decode("public+read", schema)).toStrictEqual({
        mode: "AND",
        operations: [
          { operator: "=", column: "public", value: true },
          { operator: "=", column: "read", value: true },
        ],
      });
    });
    it("joins OR", () => {
      expect(decode("public|read", schema)).toStrictEqual({
        mode: "OR",
        operations: [
          { operator: "=", column: "public", value: true },
          { operator: "=", column: "read", value: true },
        ],
      });
    });
    it("throws when confused", () => {
      expect(() => decode("public|read+unread", schema)).toThrow(
        "OR cannot be used with AND"
      );
    });
    it("joins AND and OR", () => {
      expect(decode("(public|read)+unread", schema)).toStrictEqual({
        mode: "AND",
        operations: [
          {
            mode: "OR",
            operations: [
              { operator: "=", column: "public", value: true },
              { operator: "=", column: "read", value: true },
            ],
          },
          { operator: "=", column: "read", value: false },
        ],
      });
    });
  });
  describe("nots", () => {
    it("joins !(AND) and OR", () => {
      expect(decode("!(public|read)+unread", schema)).toStrictEqual({
        mode: "AND",
        operations: [
          {
            mode: "NOT",
            operations: [
              {
                mode: "OR",
                operations: [
                  { operator: "=", column: "public", value: true },
                  { operator: "=", column: "read", value: true },
                ],
              },
            ],
          },
          { operator: "=", column: "read", value: false },
        ],
      });
    });
  });
});

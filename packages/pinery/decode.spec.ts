import { it, expect } from "bun:test";
import { decodeToAST } from "./decode";

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

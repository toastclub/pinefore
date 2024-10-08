import { test, expect, describe } from "bun:test";
import { haveIBeenPwned, validatePw } from "!server/middleware/auth";
import { db } from "$db";
/*
test("Is logged in", async () => {
  let res = await client.user.me.get({
    headers: {
      cookie: fakeUser.tokens.cookie,
    },
  });
  expect(res.data?.username).toBe(fakeUser.username);
});
*/

describe("Pwned Passwords", () => {
  test("Password is pwned", async () => {
    expect(haveIBeenPwned("password")).rejects.toThrow();
  });
  test("Password is not pwned", async () => {
    expect(
      haveIBeenPwned("AISIJKKCXKLZIWUIALAIH@HJKHZl;KKJDS")
    ).resolves.not.toBe({});
  });
});

test("Verify password", async () => {
  expect(validatePw("password", 1, db(""))).rejects.toThrow();
  expect(validatePw("bobbyeatstables", 1, db(""))).resolves.toBeObject();
});

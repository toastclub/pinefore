import { Elysia, Static, t } from "elysia";
import { Kysely, sql } from "kysely";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { HttpError } from "be/plugins/error";
import { dbMiddleware } from "be/db";

import { Database } from "schema";
import { cfMiddleware } from "./cf";
import { MODE } from "oss/constants";

export interface JWTPayloadSpec {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
}

const jwtType = t.Object({
  id: t.Number(),
  archival_enabled: t.Boolean(),
  account_status: t.String(),
});

export function getAuth(env: { JWT_SECRET?: string }) {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set");
  }
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  async function sign(payload: JWTPayload) {
    let jwt = new SignJWT({
      ...payload,
      nbf: undefined,
      exp: undefined,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setExpirationTime("20m");

    return jwt.sign(secret);
  }

  async function verify(token: string) {
    if (!token) {
      return false;
    }
    try {
      const data: any = (await jwtVerify(token, secret)).payload;
      return data;
    } catch (_) {
      return false;
    }
  }

  return {
    jwt: {
      sign,
      verify,
    },
  };
}

export const authPlugin = new Elysia({ name: "authPlugin" })
  .use(cfMiddleware)
  .derive({ as: "scoped" }, ({ env }) => {
    return getAuth(env);
  });

/*
if there is no token and you are not allowed to read the page unauthenticated
        return Unauthorized
if the token is correct
    return page
if the token isn't correct (likely expired) or there is no token
    if there is a refresh token
        get expires & `user info` from database
        if there is `user info` but the refresh token expired
            delete it from database
            null the `user info` variable
            continue
        if there is no `user info`
            tell browser to expire cookie
            if you are allowed to read the page unauthenticated
                return page
            else
                return Unauthorized
        at this point, we know there is a refresh token, that the token
        hasn't expired and is bound to a user. Success!
            issue new JWT
            extend refresh token lifetime in database
            return page
    if there is no refresh token
        if you are allowed to read the page unauthenticated
            return page
        else  // this is redundant, see very first statement
            return unauthorized
*/

export const requireAuth = <T extends boolean>(allowRead: T) =>
  new Elysia({ name: "requireAuth" })
    .use(dbMiddleware)
    .use(cfMiddleware)
    .derive(
      { as: "scoped" },
      async ({ cookie, request, db, waitUntil, env }) => {
        const { jwt } = getAuth(env);
        let allowUnauthenticated = request.method == "GET" && allowRead;
        if (
          (!cookie.token.value || !cookie.refresh_token.value) &&
          !allowUnauthenticated
        ) {
          throw new HttpError(401, "Unauthorized");
        }
        let user = (await jwt.verify(cookie.token.value)) as
          | false
          | Static<typeof jwtType>;
        let u = await (async () => {
          if (!user) {
            if (cookie.refresh_token.value && cookie.token.value) {
              // THIS IS A SANITY CHECK AND *NOT* A SECURITY FEATURE. We do not check if the token was
              // *ever* signed by us here, we just filter in case it helps the query planner.
              // if the attacker has the user's refresh token, it is already game over.
              const jwtPayload = JSON.parse(
                atob(cookie.token.value.split(".")[1])
              );
              let start = performance.now();
              let user = await db
                .selectFrom("tokens")
                .innerJoin("users", "users.id", "tokens.for")
                .where((eb) =>
                  eb.and([
                    eb("token", "=", cookie.refresh_token.value),
                    eb("for", "=", jwtPayload.id),
                    eb("tokens.type", "=", "default"),
                  ])
                )
                .select(["expires", "account_status", "id", "archival_enabled"])
                .executeTakeFirst();

              // if the refresh token is outdated
              if (user && user.expires < new Date()) {
                await waitUntil(
                  (async () => {
                    db.deleteFrom("tokens")
                      .where((eb) =>
                        eb.and([
                          eb("token", "=", cookie.refresh_token.value),
                          eb("for", "=", jwtPayload.id),
                        ])
                      )
                      .execute();
                    console.log("Deleted outdated refresh token", {
                      duration: performance.now() - start,
                    });
                    return;
                  })()
                );
                user = undefined;
              }

              if (!user) {
                cookie.refresh_token.expires = undefined;
                cookie.token.expires = undefined;
                if (allowUnauthenticated) {
                  return undefined;
                } else {
                  throw new HttpError(401, "Unauthorized");
                }
              }
              await waitUntil(
                (async () => {
                  await db
                    .updateTable("tokens")
                    .where((eb) =>
                      eb.and([
                        eb("token", "=", cookie.refresh_token.value),
                        eb("for", "=", jwtPayload.id),
                      ])
                    )
                    .set("expires", sql`(now() + interval '30 days')`)
                    .executeTakeFirst()!;

                  console.log("Extended token", {
                    duration: performance.now() - start,
                  });
                  return;
                })()
              );

              let newJwt = await jwt!.sign({
                id: user.id,
                account_status: user.account_status,
                archival_enabled: user.archival_enabled,
              });
              let newJwtVerified = (await jwt.verify(newJwt)) as
                | false
                | Static<typeof jwtType>;
              cookie.token.value = newJwt;
              cookie.token.maxAge = 60 * 60 * 24 * 30;
              cookie.token.sameSite = "strict";
              cookie.token.httpOnly = true;
              cookie.token.secure = !(MODE == "development");
              cookie.token.path = "/";
              return newJwtVerified || undefined;
            }
            cookie.refresh_token.expires = undefined;
            cookie.token.expires = undefined;
            if (allowUnauthenticated) {
              return undefined;
            } else {
              throw new HttpError(401, "Unauthorized");
            }
          }

          return user || undefined;
        })();
        if (u) {
          return { user: u };
        } else if (allowUnauthenticated == true) {
          return { user: u };
        } else {
          throw new HttpError(401, "Unauthorized");
        }
      }
    )
    .onError(({ error }) => {
      if (error instanceof Response) {
        return error;
      }
    });

export async function validatePw(
  password: string,
  userId: number,
  db: Kysely<Database>
) {
  const user = await db
    .selectFrom("users")
    .select(["password", "id", "email"])
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!user) {
    throw new HttpError(404, "User not found!");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new HttpError(401, undefined, ["password", "Incorrect password"]);
  }
  return user;
}

export async function updatePasswordForAuthenticatedUser(
  newPassword: string,
  userId: number,
  db: Kysely<Database>
) {
  const user = await db
    .updateTable("users")
    .set({
      password: await bcrypt.hash(newPassword, bcrypt.genSaltSync(12)),
    })
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!user) {
    throw new HttpError(404, "User not found!");
  }
}

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

export async function haveIBeenPwned(password: string) {
  let hash = (await digestMessage(password)).toUpperCase();
  let hasBeenPwned = await fetch(
    `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`
  )
    .then((r) => r.text())
    .then((r) => r.split("\n").map((x) => x.split(":")))
    .then((r) => r.some(([hashSuffix]) => hashSuffix == hash.slice(5)));
  if (hasBeenPwned) {
    throw new HttpError(401, undefined, [
      [
        "password",
        "Please choose a password that hasn't been leaked in a data breach.",
      ],
    ]);
  }
}

export async function deleteOldTokens(userId: number, db: Kysely<Database>) {
  await db
    .deleteFrom("tokens")
    .where("for", "=", userId)
    .where("expires", "<", new Date())
    .execute();
}

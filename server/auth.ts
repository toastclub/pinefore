import { Elysia, Static, t } from "elysia";
import { HttpError } from "#/plugins/error";
import { jwt } from "@elysiajs/jwt";
import { db } from "lib/db";
import { sql } from "kysely";
import { getRequestEvent } from "solid-js/web";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const jwtType = t.Object({
  id: t.Number(),
  archival_enabled: t.Boolean(),
  account_status: t.String(),
});

if (!process?.env.JWT_SECRET && getRequestEvent()) {
  throw new Error("NO JWT SECRET INSIDE OF REQUEST CONTEXT");
}
export const authPlugin = new Elysia({ name: "authPlugin" }).use(
  jwt({
    // it doesn't matter if this is undefined when there isn't a request.
    // because the code above would've thrown. afaik, the cf runtime runs everything once
    // as a sanity check, and for some reason doesn't populate process.env
    // still, this is a hack and I should feel ashamed.
    secret: process?.env.JWT_SECRET || "TEMP_AT_SERVER_BOOT",
    name: "jwt",
    exp: "20m",
    //schema: jwtType,
  })
);

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

interface AuthResponse {
  id: number;
  archival_enabled: boolean;
  account_status: string;
}

export const requireAuth = <T extends boolean>(allowRead: T) =>
  new Elysia({ name: "requireAuth" })
    .use(authPlugin)
    .derive({ as: "scoped" }, async ({ jwt, cookie, request }) => {
      let allowUnauthenticated = request.method == "GET" && allowRead;
      if (
        (!cookie.token.value || !cookie.refresh_token.value) &&
        !allowUnauthenticated
      ) {
        throw new HttpError(401, "Unauthorized");
      }

      const user = (await jwt.verify(cookie.token.value)) as
        | false
        | Static<typeof jwtType>;
      let u = await db.transaction().execute(async (trx) => {
        if (!user) {
          if (cookie.refresh_token.value && cookie.token.value) {
            // THIS IS A SANITY CHECK AND *NOT* A SECURITY FEATURE. We do not check if the token was
            // *ever* signed by us here, we just filter in case it helps the query planner.
            // if the attacker has the user's refresh token, it is already game over.
            const jwtPayload = JSON.parse(
              atob(cookie.token.value.split(".")[1])
            );
            let user = await trx
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
              await trx
                .deleteFrom("tokens")
                .where((eb) =>
                  eb.and([
                    eb("token", "=", cookie.refresh_token.value),
                    eb("for", "=", jwtPayload.id),
                  ])
                )
                .execute();
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

            await trx
              .updateTable("tokens")
              .where((eb) =>
                eb.and([
                  eb("token", "=", cookie.refresh_token.value),
                  eb("for", "=", jwtPayload.id),
                ])
              )
              .set("expires", sql`(now() + interval '30 days')`)
              .executeTakeFirst()!;

            let newJwt = await jwt.sign({
              id: user.id,
              account_status: user.account_status,
              // @ts-expect-error
              archival_enabled: user.archival_enabled,
            });
            let newJwtVerified = (await jwt.verify(newJwt)) as
              | false
              | Static<typeof jwtType>;
            cookie.token.value = newJwt;
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
      });
      if (u) {
        return { user: u };
      } else if (allowUnauthenticated == true) {
        return { user: u };
      } else {
        throw new HttpError(401, "Unauthorized");
      }
    })
    .onError(({ error }) => {
      if (error instanceof Response) {
        return error;
      }
    });

export async function validatePw(password: string, userId: number) {
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
  userId: number
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

export async function haveIBeenPwned(password: string) {
  let hash = createHash("sha1").update(password).digest("hex").toUpperCase();
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

export async function deleteOldTokens(userId: number) {
  await db
    .deleteFrom("tokens")
    .where("for", "=", userId)
    .where("expires", "<", new Date())
    .execute();
}

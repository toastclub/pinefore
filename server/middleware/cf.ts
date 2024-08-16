import Elysia from "elysia";
import type { Env } from "$index";

export type waitUntil = (promise: Promise<unknown>) => Promise<void>;

/**
 * This middleware does not execute any code. Instead, it adds typescript typings
 * to code injected in the entrypoint ($index)
 */
export const cfMiddleware = new Elysia({ name: "cf" }).derive(
  { as: "global" },
  // @ts-expect-error
  async ({ waitUntil, env }) => {
    return {
      waitUntil: waitUntil as waitUntil,
      env: env as Env,
    };
  }
);

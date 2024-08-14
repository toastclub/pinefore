import Elysia from "elysia";
import type { Env } from "$index";

export type waitUntil = (promise: Promise<unknown>) => Promise<void>;

export const cfMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  // @ts-expect-error
  async ({ waitUntil, env }) => {
    return {
      waitUntil: waitUntil as waitUntil,
      env: env as Env,
    };
  }
);

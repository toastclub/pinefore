import Elysia from "elysia";
import { Env } from "be/index";

type waitUntil = (promise: Promise<unknown>) => Promise<void>;

export const cfMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  async ({ waitUntil, env }) => {
    return {
      waitUntil: waitUntil as waitUntil,
      env: env as Env,
    };
  }
);

import Elysia from "elysia";
import type { BaselimeLogger } from "@baselime/edge-logger";

type waitUntil = (promise: Promise<unknown>) => Promise<void>;

export const cfMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  async ({ logger, waitUntil }) => {
    return {
      logger: logger as BaselimeLogger,
      waitUntil: waitUntil as waitUntil,
    };
  }
);

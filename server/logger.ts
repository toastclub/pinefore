import Elysia from "elysia";
import type { BaselimeLogger } from "@baselime/edge-logger";

export const loggerMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  async ({ logger }) => {
    return { logger: logger as BaselimeLogger };
  }
);

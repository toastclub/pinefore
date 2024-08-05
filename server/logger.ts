import Elysia from "elysia";

type waitUntil = (promise: Promise<unknown>) => Promise<void>;

export const cfMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  async ({ waitUntil }) => {
    return {
      waitUntil: waitUntil as waitUntil,
    };
  }
);

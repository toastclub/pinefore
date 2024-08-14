// incomplete

import { makePersisted } from "@solid-primitives/storage";
import { id } from "lib/id";
import { createEffect, createSignal, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { createConnectivitySignal } from "@solid-primitives/connectivity";
import { createModernPin, modernPin } from "!server/commonSchema";
import { Static } from "elysia";

type ModernPin = Static<typeof modernPin>;
type CreateModernPin = Static<typeof createModernPin>;
type UpdateModernPin = Partial<Exclude<ModernPin, "id">>;

export const createReplicationClient = (
  name: string,
  functions: {
    server: {
      insert: (data: CreateModernPin) => ModernPin;
      delete: (idS: string) => Promise<string>;
      update: (pin: UpdateModernPin) => Promise<ModernPin>;
      pull: () => Promise<{
        updated: ModernPin[];
        deleted: string[];
        created: ModernPin[];
      }>;
    };
  }
) => {
  const { insert, delete: del, update, pull } = functions.server;
  const [store, setStore] = makePersisted(createStore<ModernPin[]>([]), {
    name,
  });
  const [queue, setQueue] = makePersisted(
    createStore<
      (
        | {
            mode: "insert";
            data: CreateModernPin;
          }
        | {
            mode: "delete";
            id: string;
          }
        | {
            mode: "update";
            id: string;
            data: UpdateModernPin;
          }
      )[]
    >([]),
    {
      name: name + "-q",
    }
  );
  const [isPulling, setIsPulling] = createSignal(false);
  const online = createConnectivitySignal();
  const client = {
    insert: async (data: CreateModernPin, noQueue = false) => {
      if (!noQueue) {
        setQueue((queue) => {
          queue.push({
            mode: "insert",
            data,
          });
          return queue;
        });
      }
      setStore(store, data as any);
    },
    delete: async (idT: T[ID], noQueue = false) => {
      if (!noQueue) {
        setQueue((queue) => {
          queue.push({
            mode: "delete",
            id: idT,
          });
          return queue;
        });
      }
      setStore(idT, undefined);
    },
    update: async (data: T, noQueue = false) => {
      let idT = data[id];
      delete data[id];
      if (!noQueue) {
        setQueue((queue) => {
          queue.push({
            mode: "update",
            id: idT,
            data: data as any,
          });
          return queue;
        });
      }
      setStore(idT, (orig) => {
        return {
          ...(orig || {}),
          ...data,
        };
      });
    },
    pull: async () => {
      setIsPulling(true);
      const result = await pull();
      for (const item of result.created) {
        const itd = item[id];
        delete item[id];
        setStore(itd, item as any);
      }
      for (const item of result.updated) {
        const itd = item[id];
        delete item[id];
        setStore(itd, (orig) => {
          return {
            ...(orig || {}),
            ...item,
          };
        });
      }
      for (const item of result.deleted) {
        setStore(item, undefined);
      }
    },
  };
  createEffect(async () => {
    if (isPulling()) return;
    if (!online()) return;
    if (queue.length === 0) return;
    for (const item of queue) {
      if (item.mode === "insert") {
        const res = await insert(item.data);
        client.insert(res, true);
      } else if (item.mode === "delete") {
        await del(item.id);
      } else if (item.mode === "update") {
        const res = await update(item.id, item.data);
        client.update(res, true);
      }
    }
  });
  createEffect(async () => {
    if (untrack(() => isPulling())) return;
    if (!online()) return;
    await client.pull();
  });
  client.pull();
  return { client, store };
};

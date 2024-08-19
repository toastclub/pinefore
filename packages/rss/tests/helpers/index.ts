import { spyOn } from "bun:test";
import { readFile } from "fs/promises";
export function proxyFeed() {
  spyOn(global, "fetch").mockImplementation(
    // @ts-expect-error
    async (url: RequestInfo, init: RequestInit | undefined) => {
      if (init?.headers) {
        const headers = new Headers(init.headers);
        let etag = headers.get("If-None-Match");
        if (etag == '"aa"') {
          return new Response("", {
            status: 304,
            headers: {
              ETag: 'W/"aa"',
            },
          });
        }
        let host = new URL(url.toString()).host + ".xml";
        if (host.startsWith("example.com")) {
          host = "example.com.html";
        }
        const file = await readFile(
          new URL(`../data/${host}`, import.meta.url).pathname,
          "utf8"
        );
        return new Response(file, {
          status: 200,
          headers: {
            ETag: 'W/"aa"',
          },
        });
      }
    }
  );
}

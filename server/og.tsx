import { BASE_URL } from "oss/constants";
import { toTitleString } from "oss/packages/pinery/title/title";
import { pinFilterSchema } from "./pinFilterEngine";
import { decode } from "oss/packages/pinery/browser";

import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori, { init } from "satori/wasm";
import initYoga from "yoga-wasm-web";

import { RESVG_WASM, YOGA_WASM } from "oss/og.macro" with { type: "macro"}

let initialized = false;
const initialize = async () => {
  if (initialized) return;
  const { default: resvgWasm } = await import(
    /* @vite-ignore */ `${RESVG_WASM}?module`
  );
  const { default: yogaWasm } = await import(
    /* @vite-ignore */ `${YOGA_WASM}?module`
  );
  initialized = true;
  return Promise.all([
    await initWasm(resvgWasm),
    init(await initYoga(yogaWasm)),
  ]);
};

async function getTitle(path: string) {
  const u = new URL(path, BASE_URL);
  if (path.startsWith("pins")) {
    let filter = u.searchParams.get("where");
    if (filter) {
      {
        return {
          title: toTitleString(
            pinFilterSchema,
            [
              "Pins",
              { type: "created", dontIncludeK: true },
              { type: "title" },
              { type: "tags" },
            ],
            decode(filter, pinFilterSchema)
          ),
        };
      }
    }
    return {
      title: "Pins",
      subtitle: "",
    };
  }
  return undefined;
}

export async function generateOG(path: string) {
  const font = fetch(`${BASE_URL}/fonts/fernbold.otf`);
  const bg = fetch(`${BASE_URL}/branding/og/ogbg.jpeg`)
    .then((res) => res.arrayBuffer())
    .then((a) => ({
      type: "img",
      props: {
        src: a,
        style: {
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        },
      },
    }));
  const title = await getTitle(path);
  if (!title) {
    return Buffer.from(
      await (await fetch(`${BASE_URL}/branding/og/pinefore.png`)).arrayBuffer()
    );
  }
  await initialize();
  const string = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      },
      children: [
        await bg,
        {
          type: "div",
          props: {
            style: {
              height: "100%",
              width: "100%",
              display: "flex",
              fontFamily: "Fernvar",
              color: "#2C6F48",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    paddingLeft: "40px",
                    paddingTop: "40px",
                  },
                  children: [
                    {
                      type: "h1",
                      props: {
                        style: { fontSize: "50px", margin: "0" },
                        children: title.title,
                      },
                    },
                    {
                      type: "p",
                      props: {
                        style: { color: "#A8A8A8", fontSize: "28px" },
                        children: title?.subtitle || "",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
  const svg = await satori(string, {
    width: 1200,
    height: 630,
    fonts: [
      {
        data: await (await font).arrayBuffer(),
        name: "Fernvar",
      },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  return png;
}
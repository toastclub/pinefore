import { BASE_URL } from "!constants";
import { toTitleString } from "!packages/pinery/title/title";
import { pinFilterSchema } from "../server/pinFilterEngine";
import { decode } from "!packages/pinery/browser";

import satori, { init } from "satori/wasm";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgwasm from "../../../oss/node_modules/@resvg/resvg-wasm/index_bg.wasm";
import yogawasm from "../../../oss/node_modules/yoga-wasm-web/dist/yoga.wasm";
import initYoga from "yoga-wasm-web";
import { getSubtitle, getTitle } from "./title";

const initialize = async () => {
  try {
    await initWasm(resvgwasm as WebAssembly.Module);
    const yoga = await initYoga(yogawasm as WebAssembly.Module);
    init(yoga);
  } catch (error) {
    console.error(error);
  }
};

async function getTitleUi(path: string) {
  const u = new URL(path, BASE_URL);
  if (path.startsWith("pins")) {
    let filter = u.searchParams.get("where");
    if (filter) {
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
    return {
      title: "Pins",
      subtitle: "",
    };
  }
  if (path.startsWith("tag/")) {
    const tag = u.pathname.split("/")[2];
    return {
      title: {
        type: "h1",
        props: {
          style: {
            fontSize: "75px",
            margin: "0",
            color: "#000",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          },
          children: [
            "Tag:",
            {
              type: "span",
              props: {
                style: {
                  background: "#ddd",
                  padding: "5px 10px",
                  borderRadius: "9999px",
                },
                children: "#" + tag,
              },
            },
          ],
        },
      },
    };
  }
  const tit = getTitle(path);
  if (tit) {
    return {
      title: tit,
      subtitle: getSubtitle(path) || "",
    };
  }
  return {
    title: "",
    subtitle: "",
  };
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
  const title = await getTitleUi(path);
  if (!title || title.title == "") {
    return Buffer.from(
      await (await fetch(`${BASE_URL}/branding/og/pinefore.png`)).arrayBuffer()
    );
  }
  if ((await font).headers.get("content-type") !== "font/otf") {
    return (await font).text();
  }
  await initialize();
  console.log(title);
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
                    maxWidth: "75%",
                    display: "flex",
                    flexDirection: "column",
                    paddingLeft: "40px",
                    paddingTop: "40px",
                  },
                  children: [
                    typeof title.title == "string"
                      ? {
                          type: "h1",
                          props: {
                            style: { fontSize: "75px", margin: "0" },
                            children: title.title,
                          },
                        }
                      : title.title,
                    {
                      type: "p",
                      props: {
                        style: {
                          color: "#A8A8A8",
                          fontSize: "38px",
                          margin: "0",
                        },
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
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

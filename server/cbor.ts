import Elysia from "elysia";
import { encode } from "cbor-x";

export default () =>
  new Elysia({ name: "cbor" }).onAfterHandle({ as: "global" }, (e) => {
    if (e.headers["accept"] == "application/cbor") {
      e.set.headers["Content-Type"] = "application/cbor";
      return encode(e.response);
    }
  });

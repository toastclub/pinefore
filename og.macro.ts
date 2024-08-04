import _YOGA_WASM from "yoga-wasm-web/dist/yoga.wasm?url";
import _RESVG_WASM from "@resvg/resvg-wasm/index_bg.wasm?url";

let RESVG_WASM: string = _RESVG_WASM;
console.log(RESVG_WASM);
RESVG_WASM = RESVG_WASM.replace("/_build", "");

let YOGA_WASM: string = _YOGA_WASM;
YOGA_WASM = YOGA_WASM.replace("/_build", "");

export { RESVG_WASM, YOGA_WASM };

import { autotyping } from "./autotyping";
import isValidHttpUrl from "./is-valid-url";
import { stringToBoolean } from "./stringToBool";
import { chunks } from "./chunks";

export function index(obj: object, is: string | string[], value?: any) {
  if (typeof is == "string") return index(obj, is.split("."), value);
  else if (is.length == 1 && value !== undefined) return (obj[is[0]] = value);
  else if (is.length == 0) return obj;
  return index(obj[is[0]], is.slice(1), value);
}

export { autotyping, isValidHttpUrl, stringToBoolean, chunks };

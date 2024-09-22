import { decode, encode } from "../server/helpers/base62";

export const id = {
  gen: (id: number) => encode(id),
  dec: (sqid: string) => decode(sqid),
};

/**
 * Memento is a particularly niche protocol to use web archives that has somehow
 * become adopted by all of them.
 *
 * @see https://ws-dl.blogspot.com/2013/07/2013-07-15-wayback-machine-upgrades.html
 * @see http://timetravel.mementoweb.org/about/#find
 * @see http://mementoweb.org/depot/
 */

/**
 * - The `url` parameter is the URL of the resource you want to access.
 * - The `tz` parameter is the timestamp of the resource you want to access.
 * - In some cases, archives use proprietary identifiers instead of timestamps, indicated by the `id` parameter.
 */
export const mementoDepots = {
  "archive.today": {
    TimeGate: "https://archive.today/timegate/{url}" as const,
    Memento: "https://archive.today/{tz}/{url}" as const,
    TimeMap: "https://archive.today/timemap/link/{url}" as const,
  },
  wayback: {
    TimeGate: "https://web.archive.org/web/{url}" as const,
    Memento: "https://web.archive.org/web/{tz}/{url}" as const,
    TimeMap: "http://web.archive.org/web/timemap/link/{url}" as const,
  },
  loc: {
    TimeGate: "https://webarchive.loc.gov/all/{url}" as const,
    Memento: "https://webarchive.loc.gov/all/{tz}/{url}" as const,
    TimeMap: "https://webarchive.loc.gov/all/timemap/link/{url}" as const,
  },
  "perma.cc": {
    TimeGate: "https://perma.cc/timegate/{url}" as const,
    Memento: "https://perma.cc/{id}" as const,
    TimeMap: "https://perma.cc/timemap/link/{url}" as const,
  },
  "archive-it": {
    TimeGate: "https://wayback.archive-it.org/all/{url}" as const,
    // can id be predicted?
    Memento: "https://wayback.archive-it.org/all/{id}/{tz}/{url}" as const,
    TimeMap: "https://wayback.archive-it.org/all/timemap/link/{url}" as const,
  },
  stanford: {
    TimeGate: "https://swap.stanford.edu/{url}" as const,
    Memento: "https://swap.stanford.edu/{tz}/{url}" as const,
    TimeMap: "https://swap.stanford.edu/timemap/link/{url}" as const,
  },
};

export type MementoDepot = keyof typeof mementoDepots;

export async function getTimemap(
  depot: MementoDepot | MementoDepot[],
  url: string | URL,
  options: {
    /**
     * @default "sequential"
     */
    mode: "shuffle" | "sequential";
  } = { mode: "sequential" }
) {
  if (typeof depot === "string") {
    depot = [depot];
  }
  if (options.mode === "shuffle") {
    depot = depot.sort(() => Math.random() - 0.5);
  }
  const u = new URL(
    mementoDepots[depot[0]].TimeMap.replaceAll("{url}", url.toString())
  );
  let res = await fetch(u);
  if (res.status != 200) {
    depot.shift();
    return getTimemap(depot, url, options);
  }
  const t = await res.text();
  return t
    .split("\n")
    .map((l) => l.split(";").map((l) => l.trim()))
    .flatMap((row) => {
      const rel = row[1];
      if (
        !(
          rel == 'rel="memento"' ||
          rel == 'rel="first memento"' ||
          rel == 'rel="last memento"'
        )
      ) {
        return [];
      }
      // dt matcher
      const dt = row[2].match(/datetime="([^"]+)"/)?.[1];
      if (!dt) {
        return [];
      }
      return [{ url: row[0].slice(1, -1), tz: new Date(dt) }];
    });
}

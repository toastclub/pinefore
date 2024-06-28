import { Key } from "@solid-primitives/keyed";
import { createStore } from "solid-js/store";
import { TransitionGroup } from "solid-transition-group";

function computeIncrement(str: string) {
  let map = [];
  let freq: Record<string, number> = {};
  for (const c of str.split("")) {
    if (freq[c] == undefined) freq[c] = 0;
    map.push([c.replaceAll(" ", "&nbsp;"), freq[c]]);
    freq[c]++;
  }
  return map;
}

export default function Hello() {
  const [strng, setString] = createStore(computeIncrement("wikipedia.org"));
  setTimeout(() => setString(computeIncrement("google.com")), 1000);
  return (
    <div class="text-40px font-fern w-100% text-center mt-30 justify-center items-center flex">
      <TransitionGroup name="pill">
        <Key each={strng} by={(c) => `${c[0]}${c[1]}`}>
          {(c) => <span class="pill" innerHTML={c()[0]}></span>}
        </Key>
      </TransitionGroup>
    </div>
  );
}

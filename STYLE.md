Broadly, I think code style can be broken down into 3 catagories:

- Spagehtti code
- Framework inspired
- Primitive driven

Solid.js uses code that is highly primitive driven. These primatives compose together in beautiful ways. For instance, lets look at `@solid-primitives/scheduled`:

```ts
let [isGoing, setIsGoing] = createSignal(false);
const trigger = throttle(setIsGoing, 250);
trigger(false);
// calling on the leading edge
leading(throttle, setIsGoing, 250);
```

if you delve into the source code of any one of these primitives, you'll see that they too are comprised of other primitives. It's a style that is highly composable and easy to reason about. It's a style that is highly testable and maintainable. It lends itself to tiny bundle sizes.

On the backend, I like to model this. In some ways, we are creating frameworks, right, because the primatives are basically a series of stacking abstractions. But these frameworks remain portable. That is to say, you could take this from one design kit to another. So the backend is built similarly. Take this example:

```ts
export function tagNotDotPrefixed(
  eb: ExpressionBuilder<Database, "userentities" | "entitytags">
) {
  return eb.not(eb("tag", sql`^@`, ".").$castTo<boolean>());
}

export function tagsViaUserEntity(
  eb: ExpressionBuilder<Database, "entities" | "userentities">,
  isMe?: boolean
) {
  return sql<{ tags: string[] }>`(select array(${eb
    .selectFrom("entitytags")
    .select("tag")
    .$if(isMe != true, (e) => e.where(tagNotDotPrefixed))
    // snip
  );
}
```

The higher level one is useful, but it is composed of lower level primatives in a very DRY fasion. Very nice.

A couple other things:

I actually like throwing. Sue me. It lets me do stuff like

```ts
await captcha(req);
// everything beyond this point means the captcha was passed
```

Again, a very easy way to add complex functionality, in one line of code! as opposed to all the manual handling otherwise.

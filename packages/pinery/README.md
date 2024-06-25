# Pinery

Pinery is a URL-query-safe*ish* filtering engine. It is designed to serialize strings like `(tags=ids+tags!=databases)|tags=cats` into a "query plan" that can be easily modified for a database query.

## Show and tell

Given the following query string: `unread+!(date=2023-03-03)+tags=tag1,tag2`

`decodeToAST` outputs:

```js
[
  {
    type: "expr",
    data: "unread",
    concluded: true,
  }, {
    type: "oper",
    data: "+",
    concluded: true,
  }, {
    type: "oper",
    data: "!",
    concluded: true,
  }, {
    type: "parn",
    data: [
      [Object ...]
    ],
    concluded: true,
  }, {
    type: "oper",
    data: "+",
    concluded: true,
  }, {
    type: "expr",
    data: "tags=tag1,tag2",
    concluded: false,
  }
]
```

This is parsed into a query plan by `decode()`, which is schema aware.:

```js
{
  mode: "AND",
  operations: [
    {
      column: "read",
      operator: "=",
      value: false,
    },
    {
      mode: "NOT",
      operations: [
        {
          mode: "AND",
          operations: [
            {
              column: "date",
              operator: "=",
              value: "2023-03-03T00:00:00.000Z",
            },
          ],
        },
      ],
    },
    {
      column: "tags",
      operator: "=",
      value: ["tag1", "tag2"],
    },
  ],
};
```

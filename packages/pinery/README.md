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

And then it is your responsibility to convert this query plan into actual SQL. Ensure that you are using parameterized queries to prevent SQL injection.

## Features

Schema aware, you cannot filter on non-existent columns. Values must be of the correct type. Operators must make sense for the column type.

There is a browser decoder, which outputs overly simplified query plans that choose not to burden themselves with things like nesting. This is useful for client-side UI filtering. For instance, calling `clientDecode` on `user_id=1+created_at>2021-01-01+tags=tag1,tag2+tags!=tag3` will result in the following object:

```js
{
  user_id: [["=", 1]],
  created_at: [[">", new Date("2021-01-01")]],
  tags: [
    ["=", ["tag1", "tag2"]],
    ["!=", ["tag3"]],
  ],
}
```

and `clientEncode` will convert this object back into a query string.

## Grammar

The grammar is as follows:

```ts
export const operators = [
  "!=", // not equal
  "==", // strict equal (string)
  "=", // equal, except strings which are fuzzy
  ">", // greater than
  "<", // less than
  ">=", // greater than or equal
  "<=", // less than or equal
  "^=", // starts with
  "$=", // ends with
] as const;
```

Subexpressions are wrapped in parentheses. The output of subexpressions can be inverted with `!`. The `+` operator is used for AND, and the `|` operator is used for OR. Only one of `+` or `|` can be used in a context. Lists are joined with commas. Booleans do not have values, just the column name. The developer specifies one column name for true, and one for false, within the schema.
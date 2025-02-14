export const config = {
  comments: { lineComment: "//" },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"', notIn: ["string", "comment"] },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
  folding: {
    offSide: true,
  },
};

// Based off Monaco's GraphQL syntax, slightly edited to include Prisma's keywords.
export const language: any = {
  keywords: ["true", "false", "enum", "datasource", "generator", "model"],

  typeKeywords: [
    "String",
    "Boolean",
    "Int",
    "BigInt",
    "Float",
    "Decimal",
    "DateTime",
    "Json",
    "Bytes",
    "Unsupported",
  ],

  operators: ["=", ":", "!", "?", "[]"],

  // we include these common regular expressions
  symbols: /[=!?:]+/,

  // Prisma doesn't mention any string escapes, so just leaving this as default from graphql.
  escapes: /\\(?:["\\/bfnrt]|u[0-9A-Fa-f]{4})/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // fields and argument names
      [
        /[a-z_][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "key.identifier",
          },
        },
      ],

      // identify typed input variables
      [
        /[$][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "argument.identifier",
          },
        },
      ],

      // to show class names nicely
      [
        /[A-Z][\w$]*/,
        {
          cases: {
            "@typeKeywords": "keyword",
            "@default": "type.identifier",
          },
        },
      ],

      // whitespace
      { include: "@whitespace" },

      // delimiters and operators
      [/[{}()[\]]/, "@brackets"],
      [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],

      [/@*\s*[a-zA-Z_$][\w$]*/, { token: "annotation" }],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],

      // delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/\/\/.*$/, "comment"],
    ],
  },
};

export const suggestions = [
  {
    label: 'datasource',
    kind: 17,
    insertText: 'datasource {\n  provider = ""\n  url = ""\n}',
    detail: 'Define a datasource for the database connection.',
  },
  {
    label: 'generator',
    kind: 17,
    insertText: 'generator {\n  provider = ""\n}',
    detail: 'Define a generator for Prisma Client.',
  },
  {
    label: 'model',
    kind: 17,
    insertText: 'model ',
    detail: 'Define a model for Prisma schema.',
  },
  {
    label: 'enum',
    kind: 17,
    insertText: 'enum ',
    detail: 'Define an enum type for Prisma schema.',
  },
  {
    label: 'provider',
    kind: 17,
    insertText: 'provider = ',
    detail: 'Specify the provider (e.g., "postgresql", "mysql").',
  },
  {
    label: 'url',
    kind: 17,
    insertText: 'url = ',
    detail: 'Specify the connection URL for the datasource.',
  },
  {
    label: '@@id',
    kind: 17,
    insertText: '@@id',
    detail: 'Define a composite primary key.',
  },
  {
    label: '@id',
    kind: 17,
    insertText: '@id',
    detail: 'Mark a field as the primary key.',
  },
  {
    label: '@unique',
    kind: 17,
    insertText: '@unique',
    detail: 'Mark a field as unique.',
  },
  {
    label: '@default',
    kind: 17,
    insertText: '@default()',
    detail: 'Set a default value for a field.',
  },
];
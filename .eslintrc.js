module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  overrides: [
    {
      files: ["scripts/**"],
      rules: { "no-process-exit": "off" },
    },
  ],
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      {
        version: ">=13.0.0",
        ignores: ["modules"],
      },
    ],
  },
};

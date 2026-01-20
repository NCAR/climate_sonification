/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],

  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      extends: ["plugin:@typescript-eslint/recommended"],
    },
    {
      files: ["src/pages/HomeScreen.tsx"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "react-hooks/set-state-in-effect": "warn", // or "off"
      },
    },
    {
      files: [
        "src/pages/Simulation.jsx",
        "src/pages/EachAlone.jsx",
        "src/pages/AllTogether.jsx",
      ],
      rules: {
        "no-unused-vars": "warn",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "react/prop-types": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

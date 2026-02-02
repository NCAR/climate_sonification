/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: { version: "detect" },
  },

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],

  rules: {
    // React 17+ new JSX transform
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
  },

  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },

        // ✅ REQUIRED for the *type-checked* rule sets
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      extends: [
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/strict-type-checked",
      ],
      rules: {
        // your “boundary finders”
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",

        "@typescript-eslint/explicit-function-return-type": "warn",
        "@typescript-eslint/explicit-module-boundary-types": "warn",

        "@typescript-eslint/no-explicit-any": "warn",
      },
    },

    // Optional per-file exceptions
    {
      files: ["src/pages/HomeScreen.tsx"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "react-hooks/set-state-in-effect": "warn",
      },
    },
  ],
};

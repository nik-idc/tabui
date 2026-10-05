// @ts-check

import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const namingConventions = [
  {
    selector: ["class", "interface"],
    format: ["PascalCase"],
  },
  {
    selector: [
      "variable",
      "method",
      "property",
      "classicAccessor",
      "parameterProperty",
    ],
    format: ["camelCase"],
  },
  {
    selector: "variable",
    modifiers: ["const"],
    format: ["camelCase", "UPPER_CASE"],
  },
  {
    selector: ["classProperty", "parameterProperty"],
    modifiers: ["readonly"],
    format: ["camelCase", "UPPER_CASE"],
  },
  {
    selector: ["classProperty", "parameterProperty"],
    modifiers: ["private"],
    format: ["camelCase"],
    leadingUnderscore: "require",
  },
  {
    selector: ["classProperty", "objectLiteralProperty", "typeProperty"],
    modifiers: ["requiresQuotes"],
    format: null,
  },
  {
    selector: "classicAccessor",
    modifiers: ["private"],
    format: ["camelCase"],
    leadingUnderscore: "allow",
  },
  {
    selector: ["classProperty", "parameterProperty"],
    modifiers: ["private", "readonly"],
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "require",
  },
];

export default defineConfig(
  globalIgnores(["dist/**", "demo/dist/**", ".agents/**"]),
  {
    files: ["**/*.{js,ts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as" },
      ],
      "@typescript-eslint/naming-convention": ["error", ...namingConventions],
    },
  },
  {
    files: ["*.config*.{js,cjs,mjs,ts}"],
    languageOptions: {
      globals: {
        module: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/**"],
              message:
                "Use relative imports in package source; @/ is a demo-only alias.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/notation/model/instrument/guitar/default-tunings.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...namingConventions,
        {
          selector: "objectLiteralProperty",
          format: ["camelCase", "PascalCase"],
        },
      ],
    },
  }
);

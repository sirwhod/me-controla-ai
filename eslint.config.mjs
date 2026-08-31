import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"
import prettier from "eslint-config-prettier"

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaFeatures: { jsx: true },
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  prettier,
  {
    files: ["scripts/test-suite.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-rest-params": "off",
    },
  },
  {
    ignores: [
      ".next/",
      "node_modules/",
      "dist/",
      "public/",
      "**/__tests__/",
      "next-env.d.ts",
      "next.config.mjs",
      "eslint.config.mjs",
      "postcss.config.mjs"
    ],
  }
]

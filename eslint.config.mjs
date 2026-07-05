import js from "@eslint/js"
import prettier from "eslint-config-prettier"

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
  },
  prettier,
]

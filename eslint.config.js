import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: [
      "node_modules",
      ".tanstack",
      ".output",
      ".nitro",
      "dist",
      "build",
      "public",
      "public/**",
      "dist/**",
      "build/**",
    ],
  },
);

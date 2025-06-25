import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier,
    },
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "node_modules",
      ".tanstack",
      ".output",
      ".nitro",
      ".vercel",
      "dist",
      "build",
      "public",
      "public/**",
      "dist/**",
      "build/**",
    ],
  },
);

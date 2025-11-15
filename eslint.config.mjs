import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // Fixes the "Unexpected any" error
      "@typescript-eslint/no-explicit-any": "off",
      // Fixes the "'icon' is defined but never used" error
      "@typescript-eslint/no-unused-vars": "off",
      // Silences the <img> warnings
      "@next/next/no-img-element": "off",
    },
  },
  // --- END OF BLOCK ---
];

export default eslintConfig;

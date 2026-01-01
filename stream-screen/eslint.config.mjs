import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // Configuración específica para el proyecto
    rules: {
      // Mejorar la calidad del código
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",

      // Reglas para TypeScript/JavaScript moderno
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",

      // Reglas para React
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",

      // Reglas para Next.js
      "@next/next/no-html-link-for-pages": ["error", "./pages/"],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignorar mocks y tests
    "**/*.mock.js",
    "**/*.test.js",
    "**/*.spec.js",
    "**/lib/mocks/**",
  ]),
]);

export default eslintConfig;

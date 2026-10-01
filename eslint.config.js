import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tanstackQuery from "@tanstack/eslint-plugin-query"
import tseslint from "typescript-eslint"

const productionTestImportRestriction = {
  group: ["@tests/*"],
  message: "Código de produção não deve importar infraestrutura de testes.",
}

const toastImportRestriction = {
  name: "@/components/ui/toast",
  message:
    "Use @/components/toast/toast-notify para notificações; o Toast nativo é restrito à infraestrutura.",
}

const relativeToastImportRestriction = {
  group: ["**/components/ui/toast"],
  message:
    "Use @/components/toast/toast-notify para notificações; o Toast nativo é restrito à infraestrutura.",
}

const toastOnlyImportRestriction = {
  name: "@/components/ui/toast",
  allowImportNames: ["toast"],
  message: "toast-notify pode importar somente toast do componente nativo.",
}

const relativeToastOnlyImportRestriction = {
  group: ["**/components/ui/toast"],
  allowImportNames: ["toast"],
  message: "toast-notify pode importar somente toast do componente nativo.",
}

const toasterOnlyImportRestriction = {
  name: "@/components/ui/toast",
  allowImportNames: ["Toaster"],
  message: "AppProviders pode importar somente Toaster do componente nativo.",
}

const relativeToasterOnlyImportRestriction = {
  group: ["**/components/ui/toast"],
  allowImportNames: ["Toaster"],
  message: "AppProviders pode importar somente Toaster do componente nativo.",
}

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "playwright-report",
      "test-results",
      "validation-results",
      "src/components/ui",
    ],
  },
  ...tanstackQuery.configs["flat/recommended"],
  {
    ...js.configs.recommended,
    files: ["scripts/**/*.mjs", "tests/scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: { globals: globals.node, ecmaVersion: "latest", sourceType: "module" },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "react-router",
                "react-router/*",
                "node:*",
                "fs",
                "fs/*",
                "http",
                "https",
                "crypto",
                "@tanstack/*",
                "@supabase/*",
                "cloudflare:*",
                "@/app/*",
                "@/components/*",
                "@/features/*",
                "@/lib/*",
                "@tests/*",
                "**/app/**",
                "**/components/**",
                "**/features/**",
                "**/lib/**",
                "**/tests/**",
              ],
              message:
                "Contratos compartilhados devem permanecer puros e sem dependências de runtime, UI ou testes.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [toastImportRestriction],
          patterns: [
            productionTestImportRestriction,
            relativeToastImportRestriction,
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/toast/toast-notify.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [toastOnlyImportRestriction],
          patterns: [
            productionTestImportRestriction,
            relativeToastOnlyImportRestriction,
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/app-providers.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [toasterOnlyImportRestriction],
          patterns: [
            productionTestImportRestriction,
            relativeToasterOnlyImportRestriction,
          ],
        },
      ],
    },
  },
)

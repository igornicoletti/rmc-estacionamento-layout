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
    "Use @/components/toast/toast-notify para notificações; o primitive Toast é restrito à infraestrutura.",
}

const relativeToastImportRestriction = {
  group: ["**/components/ui/toast"],
  message:
    "Use @/components/toast/toast-notify para notificações; o primitive Toast é restrito à infraestrutura.",
}

const toasterOnlyImportRestriction = {
  name: "@/components/ui/toast",
  allowImportNames: ["Toaster"],
  message: "AppProviders pode importar somente Toaster do primitive Toast.",
}

const relativeToasterOnlyImportRestriction = {
  group: ["**/components/ui/toast"],
  allowImportNames: ["Toaster"],
  message: "AppProviders pode importar somente Toaster do primitive Toast.",
}

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "playwright-report",
      "test-results",
      "src/components/ui",
    ],
  },
  ...tanstackQuery.configs["flat/recommended"],
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
    files: ["src/**/*.{ts,tsx}"],
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
          patterns: [productionTestImportRestriction],
        },
      ],
    },
  },
  {
    files: ["src/app/root/app-providers.tsx"],
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

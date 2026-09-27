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

const toastPrimitiveImportRestriction = {
  name: "@/components/ui/toast",
  message:
    "O primitive Toast só pode ser importado por AppToast; use toast-notify para notificações.",
}

const relativeToastPrimitiveImportRestriction = {
  group: ["**/components/ui/toast"],
  message:
    "O primitive Toast só pode ser importado por AppToast; use toast-notify para notificações.",
}

const appToastImportRestriction = {
  name: "@/components/common/app-toast",
  message:
    "Use toast-notify para notificações; AppToast é reservado à composição da aplicação.",
}

const relativeAppToastImportRestriction = {
  group: ["**/components/common/app-toast"],
  message:
    "Use toast-notify para notificações; AppToast é reservado à composição da aplicação.",
}

const appToastPrimitiveImportNames = [
  "Toast",
  "ToastAction",
  "ToastClose",
  "ToastContent",
  "ToastDescription",
  "ToastPortal",
  "ToastProvider",
  "ToastTitle",
  "ToastViewport",
  "toast",
  "useToastManager",
]

const appToastPrimitiveImportRestriction = {
  name: "@/components/ui/toast",
  allowImportNames: appToastPrimitiveImportNames,
  message: "AppToast é o único wrapper autorizado do primitive Toast.",
}

const relativeAppToastPrimitiveImportRestriction = {
  group: ["**/components/ui/toast"],
  allowImportNames: appToastPrimitiveImportNames,
  message: "AppToast é o único wrapper autorizado do primitive Toast.",
}

const appToastManagerImportRestriction = {
  name: "@/components/common/app-toast",
  allowImportNames: ["appToastManager"],
  message: "toast-notify pode importar somente o manager do AppToast.",
}

const relativeAppToastManagerImportRestriction = {
  group: ["**/components/common/app-toast"],
  allowImportNames: ["appToastManager"],
  message: "toast-notify pode importar somente o manager do AppToast.",
}

const appToasterImportRestriction = {
  name: "@/components/common/app-toast",
  allowImportNames: ["AppToaster"],
  message: "AppProviders pode importar somente AppToaster.",
}

const relativeAppToasterImportRestriction = {
  group: ["**/components/common/app-toast"],
  allowImportNames: ["AppToaster"],
  message: "AppProviders pode importar somente AppToaster.",
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
          paths: [
            toastPrimitiveImportRestriction,
            appToastImportRestriction,
          ],
          patterns: [
            productionTestImportRestriction,
            relativeToastPrimitiveImportRestriction,
            relativeAppToastImportRestriction,
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/common/app-toast.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [appToastPrimitiveImportRestriction],
          patterns: [
            productionTestImportRestriction,
            relativeAppToastPrimitiveImportRestriction,
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
          paths: [
            toastPrimitiveImportRestriction,
            appToastManagerImportRestriction,
          ],
          patterns: [
            productionTestImportRestriction,
            relativeToastPrimitiveImportRestriction,
            relativeAppToastManagerImportRestriction,
          ],
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
          paths: [
            toastPrimitiveImportRestriction,
            appToasterImportRestriction,
          ],
          patterns: [
            productionTestImportRestriction,
            relativeToastPrimitiveImportRestriction,
            relativeAppToasterImportRestriction,
          ],
        },
      ],
    },
  },
)

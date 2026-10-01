import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"

import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        { test: {
          name: "node", environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          exclude: ["tests/unit/lib/browser/browser-clipboard.test.ts"],
        } },
        { test: {
          name: "dom", environment: "jsdom", setupFiles: ["./tests/support/setup.ts"],
          include: ["tests/unit/**/*.test.tsx", "tests/integration/**/*.test.tsx", "tests/unit/lib/browser/browser-clipboard.test.ts"],
        } },
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        reportsDirectory: "./coverage",
        thresholds: {
          "src/components/data-table/**": {
            branches: 85,
            functions: 90,
            lines: 95,
            statements: 95,
          },
        },
      },
    },
  }),
)

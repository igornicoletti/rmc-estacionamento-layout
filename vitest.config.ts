import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"

import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
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

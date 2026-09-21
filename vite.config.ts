import path from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "base-ui",
              test: /node_modules[\\/]@base-ui[\\/]/,
              priority: 20,
            },
            {
              name: "tanstack",
              test: /node_modules[\\/]@tanstack[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})

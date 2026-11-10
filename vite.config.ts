import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "tests/**"],
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
  },
} as ReturnType<typeof defineConfig> & { test: Record<string, unknown> })

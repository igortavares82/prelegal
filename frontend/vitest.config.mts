import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // e2e/ is a separate Playwright suite (npm run test:e2e), not Vitest specs.
    exclude: ["e2e/**", "node_modules/**"],
  },
});

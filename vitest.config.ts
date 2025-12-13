import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

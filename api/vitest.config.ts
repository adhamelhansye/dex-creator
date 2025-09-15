import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 60000, // 60 seconds for database operations
    hookTimeout: 60000,
    teardownTimeout: 60000,
    pool: "forks", // Use forks to avoid issues with testcontainers
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to avoid port conflicts
      },
    },
  },
});

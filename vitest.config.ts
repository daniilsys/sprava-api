import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "test-jwt-secret",
      JWT_REFRESH_SECRET: "test-jwt-refresh-secret",
      R2_ENDPOINT: "https://test.r2.cloudflarestorage.com",
      R2_ACCESS_KEY_ID: "test-key",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET: "test-bucket",
      R2_PUBLIC_URL: "https://test.cdn.example.com",
    },
  },
});

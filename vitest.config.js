// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 600_000,     // 10 min
    hookTimeout: 600_000,     // 10 min
    teardownTimeout: 120_000,
    poolOptions: { threads: { minThreads: 1, maxThreads: 1 } },
  },
});

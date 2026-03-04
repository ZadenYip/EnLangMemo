import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './src/setup-vitest.ts',
    globals: true
  }
});
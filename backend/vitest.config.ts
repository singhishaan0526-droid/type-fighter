import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@type-fighter/shared': path.resolve(import.meta.dirname, '../shared/src/index.ts')
    }
  },
  test: {
    testTimeout: 15000
  }
});

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.ts'],
      exclude: ['packages/**/src/__tests__/**']
    },
    alias: {
      'alliage-di': resolve(__dirname, 'packages/dependency-injection/src'),
      'alliage-lifecycle': resolve(__dirname, 'packages/lifecycle/src'),
      'alliage-process-manager': resolve(__dirname, 'packages/process-manager/src'),
      'alliage-config-loader': resolve(__dirname, 'packages/configuration-loader/src'),
      'alliage-events-listener-loader': resolve(__dirname, 'packages/events-listener-loader/src'),
    },
  },
}); 
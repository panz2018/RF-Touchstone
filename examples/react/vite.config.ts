import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 1e5,
    exclude: [...configDefaults.exclude, '**/.yarn/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', '**/*.test.{ts,tsx}'],
    },
  },
  build: {
    outDir: 'dist', // Explicitly define output directory
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      treeshake: true,
      external: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test/**',
        '**/eslint.config.js',
        '**/vite.config.ts',
      ],
    },
  },
})

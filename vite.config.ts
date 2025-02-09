import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'], // Output report format
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  build: {
    lib: {
      entry: './src/index.ts', // Entry point file
      name: 'TouchStone', // Global variable name for UMD format
      fileName: (format) => `TouchStone.${format}.js`, // Output filenames
      formats: ['es', 'cjs'], // Suport both ESM and CommonJS
    },
    rollupOptions: {
      external: [
        '**/*.test.ts', // Exclude files ending with '.test.ts'
        '**/tests/**', // Exclude the entire 'tests' directory
      ],
    },
  },
  plugins: [dts({ exclude: '**/*.test.ts' })],
})

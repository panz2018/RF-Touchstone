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
    testTimeout: 1e5, // Unit: millisecond
    exclude: [...configDefaults.exclude, '**/docs/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'], // Output report format
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      include: ['src/**/*.ts', 'tests/**/*.ts'],
    },
  },
  build: {
    minify: 'esbuild',
    target: 'esnext', // 确保目标环境支持现代语法
    lib: {
      entry: './src/touchstone.ts', // Entry point file
      name: 'Touchstone', // Global variable name for UMD format
      fileName: (format) => `Touchstone.${format}.js`, // Output filenames
      formats: ['es', 'cjs', 'umd'], // Suport both ESM, CommonJS, and UMD formats
    },
    rollupOptions: {
      treeshake: true, // 显式启用 Tree Shaking
      external: [
        '**/*.test.ts', // Exclude files ending with '.test.ts'
        '**/tests/**', // Exclude the entire 'tests' directory
      ],
    },
  },
  plugins: [dts({ exclude: ['**/*.test.ts', '**/tests/**'] })],
})

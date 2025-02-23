import { defineConfig, type PluginOption } from 'vite'
import { configDefaults } from 'vitest/config'
import path from 'path'
import dts from 'vite-plugin-dts'
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * Vite configuration for RF-Touchstone library
 * Handles both development and production builds
 */
export default defineConfig({
  resolve: {
    alias: {
      // Set up path alias for better import readability
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    testTimeout: 1e5, // Unit: millisecond
    exclude: [...configDefaults.exclude, '**/docs/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'], // Multiple report formats for different use cases
      thresholds: {
        // Enforce 100% test coverage across all metrics
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
    target: 'esnext', // Ensure modern JavaScript features are supported
    lib: {
      entry: './src/touchstone.ts', // Main library entry point
      name: 'Touchstone', // Global variable name when used in browser
      fileName: (format) => `Touchstone.${format}.js`, // Generate different bundles for each format
      formats: ['umd', 'cjs', 'es'], // Support ESM, CommonJS, and Universal Module Definition
    },
    rollupOptions: {
      treeshake: true, // Enable dead code elimination
      external: [
        '**/*.test.ts', // Exclude test files from the build
        '**/tests/**', // Exclude test directory from the build
      ],
    },
  },
  plugins: [
    // Generate TypeScript declaration files
    dts({ exclude: ['**/*.test.ts', '**/tests/**'] }),
    // Generate build visualization report
    visualizer({
      filename: './build/build.html',
      template: 'treemap', // Use treemap visualization template
      gzipSize: true, // Show size after gzip compression
      brotliSize: true, // Show size after brotli compression
      open: false, // Do not open the report in the browser
    }) as PluginOption,
  ],
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {defineConfig as defineVitestConfig} from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: defineVitestConfig({
    environment: 'happy-dom',
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx'], // Or your main entry point
    },
  }).test,
});

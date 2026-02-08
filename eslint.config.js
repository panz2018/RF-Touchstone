import pluginJs from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Helper to fix potential whitespace issues in the globals package
const fixGlobals = (obj) => {
  if (!obj) return {}
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.trim(), value])
  )
}

const browserGlobals = fixGlobals(globals.browser)
const nodeGlobals = fixGlobals(globals.node)

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/.yarn/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.venv/**',
      '**/docs/**',
      '**/examples/**',
      '**/test-pkg-temp/**',
    ],
  },
  {
    // Exclude JS config files from TypeScript project-based linting
    files: ['*.config.js', '*.config.mjs', '*.config.cjs'],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
    },
  },
  {
    // Configure TypeScript config files with basic linting (no project-based parsing)
    files: ['*.config.ts'],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: false, // Explicitly disable project-based parsing for config files
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...tseslint.configs.recommended[0].rules,
    },
  },
  // Apply TypeScript-specific rules only to TS files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.ts', 'test/**/*.ts', 'test-dist/**/*.ts'],
  })),
  {
    // Apply TypeScript-specific rule overrides
    files: ['src/**/*.ts', 'test/**/*.ts', 'test-dist/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Apply TypeScript project-based linting to source and test files
    files: ['src/**/*.ts', 'test/**/*.ts', 'test-dist/**/*.ts'],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  pluginJs.configs.recommended,
  prettierConfig,
]

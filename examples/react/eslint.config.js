import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

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
    name: 'app/files-to-lint',
    files: ['**/*.{js,ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/.yarn/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.venv/**',
      '**/docs/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
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
        project: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...tseslint.configs.recommended[0].rules,
    },
  },
  // Apply TypeScript-specific rules
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
  })),
  {
    // Apply TypeScript project-based linting to source and test files
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  prettierConfig,
]

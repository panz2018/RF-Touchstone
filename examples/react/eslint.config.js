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

const tsPlugin = tseslint.plugin

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
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
    // JS Recommended
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...pluginJs.configs.recommended,
  },
  // Apply TypeScript Recommended
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    // Apply TypeScript project-based linting to source and test files
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        ...fixGlobals(globals.jest),
      },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
      '@typescript-eslint': tsPlugin,
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
  {
    // Custom Rule Overrides for TypeScript
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Custom Rule Overrides for JavaScript
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
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
  prettierConfig
)

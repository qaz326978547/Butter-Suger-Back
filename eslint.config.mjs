// eslint.config.mjs
import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import airbnbBase from 'eslint-config-airbnb-base'
import prettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      js,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...airbnbBase.rules,
      ...prettier.rules, // 禁用與 Prettier 衝突的規則
      'prettier/prettier': 'error', // 將 Prettier 錯誤也視為 ESLint 錯誤

      // ✅ 你的額外需求：空格等
      'space-infix-ops': 'error',
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],
    },
  },
])

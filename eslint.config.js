import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Evitar advertencias de "set-state-in-effect" para sincronización con sistemas externos
      // Usar useEffect solo para subscripciones a eventos externos, no para setState directo
      'react-hooks/exhaustive-deps': 'warn',
      // Ignorar esta regla para casos donde se sincroniza con sistemas externos
      // Véase: I18nProvider.tsx (sincronización con i18n) y
      // platform-user-form-dialog.tsx (sincronización con props)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])

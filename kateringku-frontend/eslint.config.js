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
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Kode aplikasi sudah mengikuti saran rule ini: hook dipisah ke berkas
      // sendiri (`auth-context.ts`, `store-context.ts`, `toast.ts`) sehingga
      // tinggal berkas kit shadcn/ui (hasil generator `npx shadcn add`) yang
      // mengekspor helper gaya cva + hook bawaan bersama komponennya.
      // Memindahkan helper itu ke file terpisah justru membuat berkas-berkas ini
      // tidak sinkron dengan generator. React Refresh hanya perlu tahu nama-nama
      // di bawah ini boleh menemani komponen, jadi didaftarkan eksplisit:
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: [
            // helper gaya cva (bukan komponen)
            'badgeVariants',
            'buttonVariants',
            'buttonGroupVariants',
            'toggleVariants',
            'navigationMenuTriggerStyle',
            // hook bawaan kit shadcn/ui
            'useFormField',
            'useSidebar',
          ],
        },
      ],
    },
  },
])

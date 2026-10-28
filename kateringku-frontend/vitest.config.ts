import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Konfigurasi test terpisah dari vite.config.ts supaya build/serve tetap
// apa adanya. Alias `@` dan plugin React disamakan dengan vite.config.ts.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom', // butuh DOM untuk test AnimatedNumber
    environmentOptions: {
      // jsdom default: document.hidden = true dan requestAnimationFrame tidak ada
      // → semua test AnimatedNumber langsung lompat ke nilai akhir dan jalur
      // animasinya tidak pernah teruji. pretendToBeVisual membuat dokumen
      // "terlihat" dan rAF tersedia.
      jsdom: { pretendToBeVisual: true },
    },
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false, // import langsung dari 'vitest'
  },
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})

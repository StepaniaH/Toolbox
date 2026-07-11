import { defineConfig } from 'vite'

export default defineConfig({
  // Homepage is the only app that owns the site root.
  base: '/',
  build: {
    outDir: 'dist',
  },
})

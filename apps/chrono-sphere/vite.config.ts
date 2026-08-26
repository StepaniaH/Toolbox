import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/chrono-sphere/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: framework and date engine are cached across
        // app releases instead of riding along with business code (P3.2).
        manualChunks(id) {
          if (!id.includes('node_modules') || id.includes('@toolbox')) return
          if (id.includes('/luxon/')) return 'luxon'
          // The lunar tables are huge and only the lunar page needs them;
          // left unsplit they ride along with every timezone-selector load.
          if (id.includes('/lunar-javascript/')) return 'lunar-calendar'
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})

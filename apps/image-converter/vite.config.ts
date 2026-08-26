import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/image-converter/" : "/",
  plugins: [react()],
  optimizeDeps: { include: ["react", "react-dom/client"] },
  worker: { format: "es" },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules") || id.includes("@toolbox")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "react-vendor";
          }
        },
      },
    },
  },
});

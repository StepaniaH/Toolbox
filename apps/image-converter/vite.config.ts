import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/image-converter/" : "/",
  plugins: [react()],
  optimizeDeps: { include: ["react", "react-dom/client"] },
  build: { outDir: "dist" },
});

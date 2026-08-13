import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: mode !== "production",
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_PROXY || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
}));

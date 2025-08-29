// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Log at build-time (will show in terminal, not browser)
console.log("🔗 Using BACKEND_URL =", process.env.VITE_BACKEND_URL);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // allows "@/..." imports
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api → backend (local dev only)
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Expose only what you need (import.meta.env is preferred in code)
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
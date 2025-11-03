// frontend/vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // loads .env, .env.local, etc.
  console.log("🔍 VITE_BACKEND_BASE:", env.VITE_BACKEND_BASE || process.env.VITE_BACKEND_BASE);
  const isDev = mode === "development";

  // This is what the client will prepend to API fetch paths
  // In dev: proxied to backend (localhost:8080)
  // In prod: should be set via VITE_BACKEND_URL in environment
  const backendBase = env.VITE_BACKEND_BASE || env.VITE_BACKEND_URL || "http://localhost:8080";
  process.env.VITE_BACKEND_BASE = backendBase;
  console.log("🔗 Client BACKEND_BASE =", process.env.VITE_BACKEND_BASE);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: isDev
        ? {
            "/api": {
              target: "http://localhost:8080", // ⬅️ match backend
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    build: {
      outDir: "dist",
      sourcemap: isDev,
    },
    // Prevent accidental use of Node-only env in the browser bundle
    define: {
      "process.env": {},
    },
  };
});

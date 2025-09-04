import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // loads .env, .env.local, etc.
  const isDev = mode === "development";

  // What the client will prepend to fetch paths ("/api" in dev, full URL in prod)
  console.log("🔗 Client BACKEND_BASE =", env.VITE_BACKEND_URL || "(undefined)");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      // In dev, proxy any request starting with /api to the local backend.
      proxy: isDev
        ? {
            "/api": {
              target: "http://localhost:8080",
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    // Prevent accidental use of Node env in the browser bundle
    define: { "process.env": {} },
  };
});
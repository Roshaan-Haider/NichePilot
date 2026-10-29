import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/chat": "http://127.0.0.1:8000",
      "/niches": "http://127.0.0.1:8000",
      "/niche": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/admin": "http://127.0.0.1:8000",
    },
  },
})

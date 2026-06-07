import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project pages are served from /<repo-name>/, so the
  // built assets need an absolute base path. The dev server and local
  // preview both work fine with "/" so we leave the base scoped to
  // production builds.
  base: process.env.NODE_ENV === "production" ? "/Tarot-Time-Bridge/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
